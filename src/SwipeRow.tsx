// Placeholder — full implementation in Phase 3.
import { forwardRef } from 'react';
import { View } from 'react-native';
import type { SwipeRowProps } from './types';

const SwipeRow = forwardRef<View, SwipeRowProps>(function SwipeRow(
    props,
    ref
) {
    return <View ref={ref}>{props.children}</View>;
});

export default SwipeRow;
