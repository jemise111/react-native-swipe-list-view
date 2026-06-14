# Examples

A managed Expo app under
[`example/`](https://github.com/jemise111/react-native-swipe-list-view/tree/master/example)
showcases every feature. Run it locally:

```bash
cd example
npm install
npx expo start
```

## What's in the example app

| Example | Source | Shows |
| --- | --- | --- |
| Basic | [`basic.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/basic.tsx) | The minimal `SwipeListView` setup. |
| SectionList | [`sectionlist.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/sectionlist.tsx) | `useSectionList` with section headers. |
| Per-row config | [`per_row_config.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/per_row_config.tsx) | Independent rows via a returned `<SwipeRow>`. See [Per-row behavior](./per-row-behavior.md). |
| Standalone row | [`standalone_row.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/standalone_row.tsx) | Using `<SwipeRow>` outside a list. |
| Swipe to delete | [`swipe_to_delete.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/swipe_to_delete.tsx) | Removing a row on swipe. |
| Swipe-value UI (legacy) | [`swipe_value_based_ui_legacy.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/swipe_value_based_ui_legacy.tsx) | Driving UI from the `onSwipeValueChange` JS callback. |
| Swipe-value UI (reanimated) | [`swipe_value_based_ui_reanimated.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/swipe_value_based_ui_reanimated.tsx) | **Recommended:** driving UI from the injected `swipeAnimatedValue` `SharedValue`. See [Migration §5](./MIGRATION.md#5-onswipevaluechange--swipeanimatedvalue-recommended). |
| Actions | [`actions.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/actions.tsx) | Activation values + action status changes. See [Actions](./actions.md). |
| Manual close | [`close_row_manually.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/close_row_manually.tsx) | Closing a row imperatively via its ref. See [Manually closing rows](./manually-closing-rows.md). |
| Accessibility | [`accessibility.tsx`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/example/examples/accessibility.tsx) | Screen-reader swipe actions. |

## Snack

Try the (v3) Snack in your browser:
<https://snack.expo.io/@jemise111/react-native-swipe-list-view>
