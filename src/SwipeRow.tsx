// Placeholder — full implementation in Phase 3.
import { forwardRef } from 'react';
import { View } from 'react-native';
import type { SwipeRowProps, SwipeRowRef } from './types';

const SwipeRow = forwardRef<SwipeRowRef, SwipeRowProps>(function SwipeRow(
    props,
    _ref
) {
    return <View>{props.children}</View>;
});

export default SwipeRow;
