const EventEmitter = require('events');
const { indexMongoDBCollection, SimiliaritySearch } = require('./matching');

const dbRefreshEmitter = new EventEmitter();

dbRefreshEmitter.on('dbRefresh', indexMongoDBCollection);
dbRefreshEmitter.on('serarchNGO', SimiliaritySearch);

module.exports = { dbRefreshEmitter };
