var posts = [];
var postLimit = 20;
var offset = 0;
var busy = false;
var throttle = null;

var baseURL = 'https://hacker-news.firebaseio.com/v0';
var topPostsRequest = $.ajax(baseURL + '/topstories.json');

$(window).scroll(function() {
   clearTimeout(throttle);
   throttle = setTimeout(function() {
      if (!busy && $(window).scrollTop() + $(window).height() == $(document).height()) {
         console.log('now');
         busy = true;
         getMoreItems(posts, offset);
      }
   }, 300);
});

function getMoreItems(topPosts, offset) {
   var counter = 0;
   topPosts = topPosts.slice(offset, offset + postLimit);

   topPosts.forEach(function(post) {
      var postData = $.ajax(baseURL + '/item/' + post + '.json');

      postData.done(function(data) {
         $('#content').append(entryFormat(data));
         if (++counter == 20) {
            $('#scroll_text').removeClass('hidden');
         }
      });
   });

   this.offset += 20;
   if (offset > 100) {
      $(window).unbind('scroll');
   }
   busy = false;
}

function entryFormat(data) {
   var link = '<a class="lead" href="' + data.url + '" >' + data.title + '</a>';
   var entryArgs = [
      '<div class="item">',
      link,
      '<p>',
      data.score,
      'points',
      ' by ' + data.by,
      '</p>',
      '</div>'
   ];

   return entryArgs.join(' ');
};


/* InfiniScroll - Every 20 once the scroll gets to the bottom of the page */
topPostsRequest.done(function(topPosts) {
   posts = topPosts;
   getMoreItems(topPosts, offset);
});

