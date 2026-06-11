// Placeholder — full implementation in Phase 4.
import { forwardRef } from 'react';
import { View } from 'react-native';
import type { SwipeListViewProps } from './types';

const SwipeListView = forwardRef<View, SwipeListViewProps>(
    function SwipeListView(props, ref) {
        return <View ref={ref}>{props.children}</View>;
    }
);

export default SwipeListView;
