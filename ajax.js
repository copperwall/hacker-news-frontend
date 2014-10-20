var entryFormat = function(data) {
   console.log(data);
   var link = '<a class="lead" href="' + data.url + '" >' + data.title + '</a>';
   var entryArgs = [
      '<div class="item">',
      link,
      data.score,
      ' by ' + data.by,
      '</div>'
   ];

   return entryArgs.join(' ');
};

var baseURL = 'https://hacker-news.firebaseio.com/v0';

var topPostsRequest = $.ajax(baseURL + '/topstories.json');

topPostsRequest.done(function(topPosts) {
   var numPosts = 0;
   topPosts.forEach(function(post) {
      var postData = $.ajax(baseURL + '/item/' + post + '.json');

      postData.done(function(data) {
         if (numPosts++ < 20) {
            $('#content').append(entryFormat(data));
            console.log(numPosts);
         }
      });
   });
});


$(document).ajaxStop(function() {
   $('#content').removeClass('hidden');
});
