var itemIds = [];
var itemList = [];
var itemLimit = 20;
var offset = 0;
var busy = false;
var scrollThrottle = null;
var ajaxTimeout = null;

var baseURL = 'https://hacker-news.firebaseio.com/v0';
var topItemsRequest = $.ajax(baseURL + '/topstories.json');

/**
 * Grabs more items from the top 100 list, with the given offset.
 */
function getMoreItems(topItems, offset) {
   topItems = topItems.slice(offset, offset + itemLimit);

   var requests = topItems.map(function(item) {
      var itemData = $.ajax(baseURL + '/item/' + item + '.json');

      return itemData;
   });

   $.when.apply($, requests).done(function() {
      var results = Array.prototype.slice.call(arguments, 0).map(function(array) {
         return array[0];
      });

      results.forEach(function(result) {
         itemList.push(result);
         $('#content').append(entryFormat(result));
      });
   });

   this.offset += 20;
   if (this.offset >= 100) {
      $('#scroll_text').hide();
      $(window).unbind('scroll');
   }
   busy = false;
}

/**
 * Throws all parts of an item div into an array and then joins it with spaces.
 */
function entryFormat(data, full) {
   var link = '<a class="lead" target="_blank" href="' + data.url + '" >' + data.title + '</a>',
       comments = data.kids ? data.kids.length : 0,
       commentLink =  full ? ''
        : '| <b><span class="comment_link" data-id="' + data.id + '" onclick="viewItem(this)">' + comments + ' comments</span></b>',
       entryArgs = [
         '<div class="item_entry">',
         link,
         '<p>',
         data.score,
         'points',
         ' by ' + data.by,
         commentLink,
         '</p>',
         '</div>',
      ];

   var blurb = entryArgs.join(' ');
   var extra = '<p>' + data.text + '</p>' + '<h3>' + comments + ' comments</h3>';

   if (full)
      return blurb + extra;
   return blurb;
};

// ITEM SPECIFIC STUFF

// Grab item from id, populate item_fields with information
// Could grab comments, but that comes later.
function viewItem(item) {
   var id = $(item).data('id'),
       item = itemList.filter(function(item) {return item.id === id;} ).pop(),
       numComments = item.kids ? item.kids.length : 0;

   $('#item_meta').html(entryFormat(item, /* full */ true));
   $('#front_page').addClass('hidden');
   $('#title').addClass('hidden');
   $('#item').removeClass('hidden');
   $('#back_button').removeClass('hidden');

   // Use $.when.apply($, objs) to wait for multiple ojects
   var commentRequests = getTopComments(item);
}

function getTopComments(item) {
   var comments = [];
   var commentids = item.kids;

   $('#comment_field').empty();
   requests = commentids.map(function(request) {
      return $.ajax(baseURL + '/item/' + request + '.json');
   });

   $.when.apply($, requests).done(function() {
      var results = Array.prototype.slice.call(arguments, 0).map(function(array) {
         return array[0];
      });

      results.forEach(function(comment) {
         var text = comment.deleted ? '[Deleted]' : comment.text;
         $('#comment_field').append('<div class="comment_blurb">' + text + '</div><hr/>');
      });
   });
}

function backToFrontPage() {
   $('#item').addClass('hidden');
   $('#back_button').addClass('hidden');
   $('#front_page').removeClass('hidden');
}


$(window).scroll(function() {
   clearTimeout(scrollThrottle);
   scrollThrottle = setTimeout(function() {
      if (!busy && $(window).scrollTop() + $(window).height() == $(document).height()) {
         busy = true;
         getMoreItems(itemIds, offset);
      }
   }, 300);
});

topItemsRequest.done(function(topItems) {
   itemIds = topItems;
   getMoreItems(topItems, offset);
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
