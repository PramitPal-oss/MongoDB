use('movieData')

db.movies.find({ $or: [{ 'rating.average': { $lt: 5 } }, { 'rating.average': { $gt: 9.3 } }] }, { rating: 1, name: 1, runtime: 1 })


db.movies.find({ 'rating.average': 9.4 })
