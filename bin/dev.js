#!/usr/bin/env node

const fs = require('fs');

fs.copyFileSync(
    'components/SwipeListView.js',
    'SwipeListExample/SwipeListView.js'
);
fs.copyFileSync('components/SwipeRow.js', 'SwipeListExample/SwipeRow.js');

fs.readFile('SwipeListExample/example.js', 'utf8', (err, data) => {
    const result = data.replace(
        "import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';",
        "import SwipeListView from './SwipeListView';\nimport SwipeRow from './SwipeRow';"
    );

    fs.writeFile('SwipeListExample/example.js', result, 'utf8', err => {
        if (err) {
            return console.log(err);
        }
    });
});
