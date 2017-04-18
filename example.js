
const searchIndex = require("search-index");
const Promise = require("promiz");
const Readable = require('stream').Readable;

var index;
var data = [{
    id: 'product:101',
    originalId: 101,
    sortedId: '000000101',
    body: ['product', 'upm', 'the description'],
    lifecycleStatus: 'Active'
}, {
    id: 'product:4',
    originalId: 4,
    sortedId: '000000004',
    body: ['product', 'upm', 'the description'],
    lifecycleStatus: 'Active'
}, {
    id: 'product:56',
    originalId: 56,
    sortedId: '000000056',
    body: ['product', 'upm', 'the description'],
    lifecycleStatus: 'Launched'
}, {
    id: 'product:151',
    originalId: 151,
    sortedId: '000000151',
    body: ['product', 'upm', 'the description'],
    lifecycleStatus: 'Active'
}, {
    id: 'product:156',
    originalId: 156,
    sortedId: '000000156',
    body: ['product', 'upm', 'the description'],
    lifecycleStatus: 'Launched'
}];

var opt = {
    id: {
        fieldOptions: {
            fieldedSearch: true,
            searchable: true
        }
    }
};

function init() {
    console.log('Init index');
    var prom = new Promise();
    searchIndex({indexPath: 'indexes'}, (err, si) => {
        if (err) {
            console.log('Error init');
            prom.reject(err)
        } else {
            index = si;
            prom.resolve();
        }
    });

    return prom;
}

function loadData() {
    console.log('Loading data');
    var prom = new Promise();
    // concurrent version
    /*index.concurrentAdd(opt, data, function (err) {
        if(err)  {
             prom.reject(err)
        } else {
            prom.resolve()
        }
    });*/

    // Stream version
    var dataStream = new Readable({ objectMode: true });
    data.forEach((data) => {
        console.log(data.id);
        dataStream.push(data)
    });
    dataStream.push(null);

    dataStream
        .pipe(index.defaultPipeline(opt))
        .pipe(index.add())
        .on('data', ()=>{})
        .on('end', () => {
            prom.resolve();
        })
        .on('error', (err) => {
            console.log('Error load');
            prom.reject(err)
        });

    return prom;
}

function query() {
    var results = [];
    var prom = new Promise();
    var q = {
        query: {
            AND: {
                lifecycleStatus: ['active']
            }
        },
        sort: {
            field: 'sortedId',
            direction: 'asc'
        },
        offset: '0',
        pageSize: '10'
    };

    index.search(q)
        .on('data', (result) => results.push(result))
        .on('error', (err) => {
            console.log('Error query');
            prom.reject(err);
        })
        .on('end', () => {
            prom.resolve(results);
        });

    return prom;
}

init()
    .then(loadData)
    .then(query)
    .then((results) => {
        console.log('RESULT:');
        console.log(JSON.stringify(results))
    })
    .catch((err) => console.log(err));
