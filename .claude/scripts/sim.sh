#!/usr/bin/env bash
# Simulator/emulator helpers for validating changes in the example app.
# Used by the /next-issue and /maintenance skills. See .claude/validation.md.
#
# Usage: .claude/scripts/sim.sh <command> [args]
#
# iOS (idb + simctl; coordinates are in points):
#   udid                         print the booted iOS simulator's UDID (boots one if none)
#   labels                       list on-screen accessibility labels with center points
#   tap-label <text>             tap the element labelled <text> (exact match first, then substring)
#   tap-in-row <row> <label>     tap the <label> element (e.g. a hidden "Close" button) nearest the row matching <row>
#   tap <x> <y>                  tap at point
#   swipe <x1> <y1> <x2> <y2>    swipe between points (0.4s)
#   row-left <text>              swipe the row whose label contains <text> to the left
#   row-right <text>             swipe that row to the right
#   row-full-left <text>         full-width swipe left (e.g. swipe-to-delete)
#   scroll-up | scroll-down      vertical scroll gesture in the lower half of the screen
#   shot <name>                  screenshot to $SIM_OUT/<name>.png, resized for reading
#
# Android (adb; coordinates are in pixels):
#   a-tap <x> <y> | a-swipe <x1> <y1> <x2> <y2> | a-shot <name>
#
# Metro log:
#   warn-count [log]             count WARN/ERROR lines in the Metro log ($METRO_LOG)
#   warns [log]                  print distinct WARN/ERROR lines
set -euo pipefail

SIM_OUT="${SIM_OUT:-${TMPDIR:-/tmp}/rnslv-validation}"
METRO_LOG="${METRO_LOG:-$SIM_OUT/metro.log}"
mkdir -p "$SIM_OUT"

udid() {
    local id
    id=$(xcrun simctl list devices booted | grep -oE '[0-9A-F-]{36}' | head -1 || true)
    if [ -z "$id" ]; then
        id=$(xcrun simctl list devices available | grep -E 'iPhone' | grep -oE '[0-9A-F-]{36}' | head -1)
        xcrun simctl boot "$id" >/dev/null
        open -a Simulator
    fi
    idb connect "$id" >/dev/null 2>&1 || true
    echo "$id"
}

# Prints "cx cy label" for every labelled element on screen.
labels() {
    idb ui describe-all --udid "$(udid)" | python3 -c '
import json, sys
for e in json.load(sys.stdin):
    label = e.get("AXLabel")
    f = e.get("frame")
    if label and f and e.get("type") != "Application":
        print(round(f["x"] + f["width"] / 2), round(f["y"] + f["height"] / 2), label)
'
}

# Prints "cx cy width" for the element whose label equals $1, else the first
# whose label contains $1.
find_label() {
    idb ui describe-all --udid "$(udid)" | python3 -c '
import json, sys
needle = sys.argv[1]
els = [e for e in json.load(sys.stdin) if e.get("frame") and e.get("type") != "Application"]
exact = [e for e in els if (e.get("AXLabel") or "").strip() == needle.strip()]
partial = [e for e in els if needle in (e.get("AXLabel") or "")]
for e in exact + partial:
    f = e["frame"]
    print(round(f["x"] + f["width"] / 2), round(f["y"] + f["height"] / 2), round(f["width"]))
    sys.exit(0)
sys.exit(1)
' "$1" || { echo "no element with label matching: $1" >&2; exit 1; }
}

screen_size() {
    idb ui describe-all --udid "$(udid)" | python3 -c '
import json, sys
for e in json.load(sys.stdin):
    if e.get("type") == "Application":
        f = e["frame"]; print(round(f["width"]), round(f["height"])); break
'
}

cmd="${1:-}"; shift || true
case "$cmd" in
    udid) udid ;;
    labels) labels ;;
    tap-label)
        read -r x y _ < <(find_label "$1")
        idb ui tap --udid "$(udid)" "$x" "$y" ;;
    tap-in-row)
        read -r _ ry _ < <(find_label "$1")
        read -r x y < <(idb ui describe-all --udid "$(udid)" | python3 -c '
import json, sys
label, ry = sys.argv[1], float(sys.argv[2])
best = None
for e in json.load(sys.stdin):
    f = e.get("frame")
    if f and (e.get("AXLabel") or "").strip() == label:
        cy = f["y"] + f["height"] / 2
        if best is None or abs(cy - ry) < abs(best[1] - ry):
            best = (f["x"] + f["width"] / 2, cy)
if best is None:
    sys.exit(1)
print(round(best[0]), round(best[1]))
' "$2" "$ry") || { echo "no '$2' element near row '$1'" >&2; exit 1; }
        idb ui tap --udid "$(udid)" "$x" "$y" ;;
    tap) idb ui tap --udid "$(udid)" "$1" "$2" ;;
    swipe) idb ui swipe --udid "$(udid)" --duration 0.4 "$1" "$2" "$3" "$4" ;;
    row-left|row-right|row-full-left)
        read -r _ y _ < <(find_label "$1")
        read -r w _ < <(screen_size)
        case "$cmd" in
            row-left) idb ui swipe --udid "$(udid)" --duration 0.4 $((w * 82 / 100)) "$y" $((w * 37 / 100)) "$y" ;;
            row-right) idb ui swipe --udid "$(udid)" --duration 0.4 $((w * 15 / 100)) "$y" $((w * 62 / 100)) "$y" ;;
            row-full-left) idb ui swipe --udid "$(udid)" --duration 0.5 $((w * 97 / 100)) "$y" 5 "$y" ;;
        esac ;;
    scroll-up|scroll-down)
        read -r w h < <(screen_size)
        x=$((w / 2)); a=$((h * 85 / 100)); b=$((h * 50 / 100))
        if [ "$cmd" = scroll-up ]; then idb ui swipe --udid "$(udid)" --duration 0.5 "$x" "$a" "$x" "$b"
        else idb ui swipe --udid "$(udid)" --duration 0.5 "$x" "$b" "$x" "$a"; fi ;;
    shot)
        sleep 1
        xcrun simctl io "$(udid)" screenshot "$SIM_OUT/$1.png" >/dev/null 2>&1
        sips -Z 800 "$SIM_OUT/$1.png" >/dev/null
        echo "$SIM_OUT/$1.png" ;;
    a-tap) adb shell input tap "$1" "$2" ;;
    a-swipe) adb shell input swipe "$1" "$2" "$3" "$4" 400 ;;
    a-shot)
        sleep 1
        adb exec-out screencap -p > "$SIM_OUT/$1.png"
        sips -Z 800 "$SIM_OUT/$1.png" >/dev/null
        echo "$SIM_OUT/$1.png" ;;
    warn-count) grep -cE '^\s*(WARN|ERROR)' "${1:-$METRO_LOG}" || true ;;
    warns) grep -E '^\s*(WARN|ERROR)' "${1:-$METRO_LOG}" | sort | uniq -c | sort -rn || true ;;
    *) sed -n '2,26p' "$0"; exit 1 ;;
esac
