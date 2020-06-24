; (function () {
    'use strict'

    var fetch = require('node-fetch')

    window.swiftTypeSearch = function (q, page, filters) {
        var engineKey = 'wv4pczb-fro-K3xZczof'
        var url = 'https://search-api.swiftype.com/api/v1/public/engines/search.json'

        var params = {
            engine_key: engineKey,
            per_page: 10,
            page: page || 1,
            facets:{ page: [ "post-type" ] },
            q: q,
            filters: filters
        }

        return fetch(url, {
            headers: {
                "content-type": "application/json",
                "pragma": "no-cache",
                "x-swiftype-integration": "search-ui",
                "x-swiftype-integration-version": "1.3.2"
            },
            referrer: "https://neo4j.com/",
            referrerPolicy: "no-referrer-when-downgrade",
            body: JSON.stringify(params),
            method: "POST",
            mode: "cors",
            credentials: "same-origin"
        })
            .then(function (res) {
                return res.json()
            })
    }

})()


