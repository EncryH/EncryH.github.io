---
layout: none
---

var idx = lunr(function () {
  this.field('title')
  this.field('excerpt')
  this.field('categories')
  this.field('tags')
  this.ref('id')

  this.pipeline.remove(lunr.trimmer)

  for (var item in store) {
    this.add({
      title: store[item].title,
      excerpt: store[item].excerpt,
      categories: store[item].categories,
      tags: store[item].tags,
      id: item
    })
  }
});

$(document).ready(function() {
  function normalize(value) {
    return (value || '').toString().toLowerCase();
  }

  function escapeHtml(value) {
    return (value || '').toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function includesQuery(item, query) {
    if (!query) {
      return false;
    }

    var searchableText = [
      item.title,
      item.excerpt,
      (item.categories || []).join(' '),
      (item.tags || []).join(' ')
    ].map(normalize).join(' ');

    return searchableText.indexOf(query) !== -1;
  }

  function getResults(query) {
    var result = [];
    var seen = {};

    if (!query) {
      return result;
    }

    result =
      idx.query(function (q) {
        query.split(lunr.tokenizer.separator).forEach(function (term) {
          q.term(term, { boost: 100 })
          if(query.lastIndexOf(" ") != query.length-1){
            q.term(term, {  usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          }
          if (term != ""){
            q.term(term, {  usePipeline: false, editDistance: 1, boost: 1 })
          }
        })
      });

    result.forEach(function (item) {
      seen[item.ref] = true;
    });

    store.forEach(function (item, index) {
      if (!seen[index] && includesQuery(item, query)) {
        result.push({ ref: index.toString(), score: 0 });
        seen[index] = true;
      }
    });

    return result;
  }

  function buildSearchItem(item) {
    var excerpt = item.excerpt ? item.excerpt.split(" ").splice(0,20).join(" ") + '...' : '';

    if(item.teaser){
      return '<div class="list__item">'+
        '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">'+
          '<h2 class="archive__item-title" itemprop="headline">'+
            '<a href="'+item.url+'" rel="permalink">'+item.title+'</a>'+
          '</h2>'+
          '<div class="archive__item-teaser">'+
            '<img src="'+item.teaser+'" alt="">'+
          '</div>'+
          '<p class="archive__item-excerpt" itemprop="description">'+excerpt+'</p>'+
        '</article>'+
      '</div>';
    }

    return '<div class="list__item">'+
      '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">'+
        '<h2 class="archive__item-title" itemprop="headline">'+
          '<a href="'+item.url+'" rel="permalink">'+item.title+'</a>'+
        '</h2>'+
        '<p class="archive__item-excerpt" itemprop="description">'+excerpt+'</p>'+
      '</article>'+
    '</div>';
  }

  function buildMastheadSearchItem(item) {
    var meta = (item.categories || []).concat(item.tags || []).slice(0, 3).join(' · ');

    return '<a class="masthead-search__result" href="'+item.url+'">'+
      '<span class="masthead-search__result-title">'+escapeHtml(item.title)+'</span>'+
      (meta ? '<span class="masthead-search__result-meta">'+escapeHtml(meta)+'</span>' : '')+
    '</a>';
  }

  function renderMastheadResults(query) {
    var results = getResults(query);
    var resultdiv = $('#masthead-search-results');
    var input = $('#masthead-search-input');

    resultdiv.empty();

    if (!query) {
      resultdiv.prop('hidden', true);
      input.attr('aria-expanded', 'false');
      return results;
    }

    if (!results.length) {
      resultdiv.append('<div class="masthead-search__empty">검색 결과가 없습니다.</div>');
    } else {
      results.slice(0, 6).forEach(function (item) {
        resultdiv.append(buildMastheadSearchItem(store[item.ref]));
      });
    }

    resultdiv.prop('hidden', false);
    input.attr('aria-expanded', 'true');
    return results;
  }

  function searchPosts() {
    var resultdiv = $('#results');
    var query = normalize($('input#search').val()).trim();
    var result = getResults(query);

    if (!query) {
      resultdiv.empty();
      return;
    }

    resultdiv.empty();
    resultdiv.prepend('<p class="results__found">'+result.length+' {{ site.data.ui-text[site.locale].results_found | default: "Result(s) found" }}</p>');
    for (var item in result) {
      var ref = result[item].ref;
      resultdiv.append(buildSearchItem(store[ref]));
    }

    if (window.history.replaceState) {
      var url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.replaceState({}, '', url);
    }
  }

  $('input#search').on('input keyup', searchPosts);

  $('#masthead-search-input').on('input focus', function () {
    renderMastheadResults(normalize($(this).val()).trim());
  });

  $('.masthead-search').on('submit', function (event) {
    event.preventDefault();
    renderMastheadResults(normalize($('#masthead-search-input').val()).trim());
  });

  $(document).on('click', function (event) {
    if (!$(event.target).closest('.masthead-search').length) {
      $('#masthead-search-results').prop('hidden', true);
      $('#masthead-search-input').attr('aria-expanded', 'false');
    }
  });

  var initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    $('input#search').val(initialQuery);
    searchPosts();
  }
});
