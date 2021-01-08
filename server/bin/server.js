#! /usr/bin/env node

import getApp from '../index.js';

const port = process.env.PORT || 5000;

getApp().listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
