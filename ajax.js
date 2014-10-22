var posts = [];
var postLimit = 20;
var offset = 0;
var busy = false;
var scrollThrottle = null;
var ajaxTimeout = null;

var baseURL = 'https://hacker-news.firebaseio.com/v0';
var topPostsRequest = $.ajax(baseURL + '/topstories.json');

/**
 * Grabs more items from the top 100 list, with the given offset.
 */
function getMoreItems(topPosts, offset) {
   topPosts = topPosts.slice(offset, offset + postLimit);

   topPosts.forEach(function(post) {
      var postData = $.ajax(baseURL + '/item/' + post + '.json');

      postData.done(function(data) {
         $('#content').append(entryFormat(data));
      });
   });

   this.offset += 20;
   if (offset > 100) {
      $('#scroll_text').hide();
      $(window).unbind('scroll');
   }
   busy = false;
}

/**
 * Throws all parts of an item div into an array and then joins it with spaces.
 */
function entryFormat(data) {
   var link = '<a class="lead" target="_blank" href="' + data.url + '" >' + data.title + '</a>';
   var comments = data.kids ? data.kids.length : 0;
   var entryArgs = [
      '<div class="item">',
      link,
      '<p>',
      data.score,
      'points',
      ' by ' + data.by,
      '| ' + comments,
      'comments',
      '</p>',
      '</div>'
   ];

   return entryArgs.join(' ');
};

$(window).scroll(function() {
   clearTimeout(scrollThrottle);
   scrollThrottle = setTimeout(function() {
      if (!busy && $(window).scrollTop() + $(window).height() == $(document).height()) {
         busy = true;
         getMoreItems(posts, offset);
      }
   }, 300);
});

topPostsRequest.done(function(topPosts) {
   posts = topPosts;
   getMoreItems(topPosts, offset);
});

/**
 * Wait until it has been 300 ms since the last AJAX completion to show the
 * content.
 */
$(document).ajaxComplete(function() {
   clearTimeout(ajaxTimeout);
   ajaxTimeout = setTimeout(function() {
      $('#content').removeClass('hidden');
      $('#scroll_text').removeClass('hidden');
   }, 300);
});
