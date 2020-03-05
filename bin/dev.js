#!/usr/bin/env node

const fs = require('fs');

fs.copyFileSync(
    'components/SwipeListView.js',
    'SwipeListExample/SwipeListView.js'
);
fs.copyFileSync('components/SwipeRow.js', 'SwipeListExample/SwipeRow.js');

fs.readdir('SwipeListExample/examples', (err, files) => {
    if (err) {
        return console.log(err);
    }
    files.forEach(fileName => {
        const fullPath = `SwipeListExample/examples/${fileName}`;
        swapImports(fullPath);
    });
});

const swapImports = path => {
    fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
            return console.log(err);
        }

        let result = data.replace(
            "import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';",
            "import SwipeListView from '../SwipeListView';\nimport SwipeRow from '../SwipeRow';"
        );

        result = result.replace(
            "import { SwipeListView } from 'react-native-swipe-list-view';",
            "import SwipeListView from '../SwipeListView';"
        );

        result = result.replace(
            "import { SwipeRow } from 'react-native-swipe-list-view';",
            "import SwipeRow from '../SwipeRow';"
        );

        fs.writeFile(path, result, 'utf8', err => {
            if (err) {
                return console.log(err);
            }
        });
    });
};
