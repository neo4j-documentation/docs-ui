;(function() {
    'use strict'

    var activeClass = 'search--active'

    var searchIcon = document.getElementById('search_open')


    var container = document.getElementsByClassName('search')[0]
    var input = container.getElementsByTagName('input')[0]
    var closeIcon = document.getElementById('close_search')
    var submitIcon = document.getElementById('submit_search')

    var filters = document.getElementsByClassName('search-filters')[0]
    var filtersHeader = document.getElementsByClassName('search-filters-header')[0]

    var results = document.getElementsByClassName('search-results')[0]

    var empty = function(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild)
        }
    }

    /**
     * Open Search
     */

    var openSearch = function() {
        container.classList.add(activeClass)
        document.getElementsByTagName('html')[0].classList.remove('is-clipped--navbar')
        document.getElementById('topbar-nav').classList.remove('is-active')
        document.getElementsByClassName('navbar-burger')[0].classList.remove('is-active')
        input.focus()
    }

    var closeSearch = function() {
        container.classList.remove(activeClass)
    }

    document.addEventListener('keydown', function(e) {
        if ( e.key === "/" && !container.classList.contains(activeClass) ) {
            openSearch()

            // Stop an extra slash from being added to the input
            e.preventDefault()
        }
        else if ( e.key === "Escape" && container.classList.contains(activeClass) ) {
            closeSearch()
        }
    })

    searchIcon.addEventListener('click', function(e) {
        e.preventDefault()

        openSearch()
    })

    // Stop annoying bubbling
    Array.from(searchIcon.childNodes)
        .forEach(function(el) {
            el.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); openSearch() })
        })


    /**
     * Close Search
     */
    container.addEventListener('click', function(e) {
        if (e.target !== this) return;

        closeSearch()
    })
    closeIcon.addEventListener('click', function() {
        closeSearch()
    })

    input.addEventListener('keydown', function(e) {
        if ( e.key === "Escape" ) {
            closeSearch()
        }
        else if ( e.key === "Enter" ) {
            e.preventDefault()
            submitForm()
        }
    })

    /**
     * Filters
     */
    filtersHeader.addEventListener('click', function(e) {
        filters.classList.toggle('search-filters--active')
    })


    /**
     * Searching
     */
    var currentQuery, currentPage, postTypes = [];
    var submitForm = function() {
        loading()

        currentQuery = input.value
        if ( !currentQuery ) return;

        postTypes = []
        currentPage = 1

        doSearch()
    }

    var goToNextPage = function(e) {
        e.preventDefault()

        currentPage++

        doSearch()
    }

    var goToPreviousPage = function(e) {
        e.preventDefault()

        currentPage--

        doSearch()
    }

    var applyFilter = function(e) {
        e.preventDefault()

        if ( e.target.checked ) {
            postTypes.push( e.target.value )
        }
        else {
            postTypes.splice( postTypes.indexOf(e.target.value), 1 )
        }

        currentPage = 1

        doSearch()
    }

    var doSearch = function() {
        loading()

        results.classList.add('loading')

        var filters = {}

        if ( postTypes.length ) {
            filters.page = { "post-type": { values: postTypes } }
        }

        window.swiftTypeSearch(currentQuery, currentPage, filters)
            .then(function(result) {
                addSummary(result)
                addFilters(result)
                addResults(result)
                addPagination(result)

                results.scrollTo(0, 0)
            })
            .finally(function() {
                results.classList.remove('loading')
            })
    }

    var loading = function() {
        results.classList.add('loading')

        empty(results)
    }

    var addSummary = function(result) {
        var info = document.getElementById('search-info')

        if ( !info ) {
            info = document.createElement('p')
            info.setAttribute('id', 'search-info')
            results.appendChild(info)
        }
        else {
            info.innerHTML = ''
        }

        if ( result.record_count > 0 ) {
            info.appendChild(document.createTextNode('Displaying results '))

            var floor = document.createElement('strong')
            floor.innerHTML = ((result.info.page.current_page-1) * result.info.page.per_page)+1
            info.appendChild( floor )

            info.appendChild(document.createTextNode(' to '))

            var ceiling = document.createElement('strong')
            ceiling.innerHTML = ((result.info.page.current_page-1) * result.info.page.per_page) + result.record_count
            info.appendChild( ceiling )

            info.appendChild(document.createTextNode(' of '))

            var count = document.createElement('strong')
            count.innerHTML = result.info.page.total_result_count
            info.appendChild( count )

            info.appendChild(document.createTextNode(' results for '))


        }
        else {
            info.innerHTML = 'No results found for '
        }

        var term = document.createElement('strong')
        term.innerHTML = result.info.page.query

        info.appendChild( term )

        info.appendChild(document.createTextNode('.'))
    }

    var addFilters = function(result) {
        var parent = document.querySelector('.search-filters-content')
        var hasFilters = false

        parent.innerHTML = ''

        Object.values(result.info.page.facets).forEach(function(facet) {
            Object.entries(facet).forEach(function(entry) {
                hasFilters = true
                var id = entry.join('-')

                var container = document.createElement('div')
                container.className = 'search-filter-checkbox'

                var input = document.createElement('input')
                input.setAttribute('id', id)
                input.setAttribute('type', 'checkbox')
                input.setAttribute('name', 'facet')
                input.setAttribute('value', entry[0])
                if ( postTypes.indexOf(entry[0]) > -1 ) {
                    input.setAttribute('checked', 'checked')
                }

                var label = document.createElement('label')
                label.setAttribute('for', id)
                label.innerHTML = entry[0]

                var span = document.createElement('span')
                span.innerHTML = entry[1]

                label.appendChild(span)

                // TODO: Click Handler
                input.addEventListener('change', applyFilter)

                container.appendChild(input)
                container.appendChild(label)

                parent.appendChild(container)
            })
        })

        if ( !hasFilters ) {
            parent.parentNode.classList.add('hidden')
        }
        else {
            parent.parentNode.classList.remove('hidden')
        }
    }

    var addResults = function(result) {
        Array.from( document.querySelectorAll('.search-result-item') )
            .forEach(function(element) {
                results.removeChild(element)
            })

        result.records.page.forEach(function(record) {
            var container = document.createElement('div')
            container.className = 'search-result-item'

            // Title
            var title = document.createElement('h3')

            var link = document.createElement('a')
            link.setAttribute('href', record.url)
            link.setAttribute('target', 'blank')
            link.innerHTML = record.highlight.title || record.title

            title.appendChild(link)
            container.appendChild(title)

            // URL
            var url = document.createElement('a')
            url.className = 'search-result-url'
            url.setAttribute('href', record.url)
            url.setAttribute('target', 'blank')
            url.innerHTML = record.url

            container.appendChild(url)


            // Excerpt
            if ( record.highlight.body ) {
                var body = document.createElement('p')
                body.className = 'search-result-body'
                body.innerHTML = record.highlight.body // || record.body

                container.appendChild(body)
            }


            // Label
            if ( record['post-type'] ) {
                var labelClass = 'label--'+ record['post-type'].toLowerCase().replace(/[^a-z0-9+]/ig, '-')
                var labelDiv = document.createElement('div')
                labelDiv.className = 'search-result-labels'

                var label = document.createElement('span')
                label.className = 'search-result-label search-result-'+ labelClass + ' '+ labelClass
                label.innerHTML = record['post-type']

                labelDiv.appendChild(label)
                container.appendChild(labelDiv)
            }


            results.appendChild(container)
        })
    }

    var addPagination = function(result) {
        var pagination = document.getElementById('search-pagination')
        var links = false

        if ( !pagination ) {
            pagination = document.createElement('div')
            pagination.setAttribute('id', 'search-pagination')
            pagination.className = 'search-pagination'
        }
        else {
            results.removeChild(pagination)
            empty(pagination)
        }

        if ( result.info.page.current_page > 1 ) {
            links = true

            var previous = document.createElement('a')
            previous.setAttribute('role', 'button')
            previous.className = 'search-pagination-link search-pagination--previous'
            previous.innerHTML = '&lt; Previous'

            previous.addEventListener('click', goToPreviousPage)

            pagination.appendChild(previous)
        }

        if ( result.info.page.num_pages > 0 && result.info.page.current_page < result.info.page.num_pages ) {
            links = true

            var next = document.createElement('a')
            next.setAttribute('role', 'button')
            next.className = 'search-pagination-link search-pagination--next'
            next.innerHTML = 'Next &gt;'

            next.addEventListener('click', goToNextPage)

            pagination.appendChild(next)
        }

        if ( links ) {
            results.appendChild(pagination)
        }
    }

    submitIcon.addEventListener('click', function() {
        submitForm()
    })

})()