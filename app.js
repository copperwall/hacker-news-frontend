var itemIds = [];
var itemList = [];
var itemLimit = 20;
var offset = 0;
var busy = false;
var scrollThrottle = null;
var ajaxTimeout = null;

// Can be list, post, or user.
var pageType = 'list';

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

   history.pushState({}, "", "comments/" + id);
   $('#item_meta').html(entryFormat(item, /* full */ true));
   $('#front_page').addClass('hidden');
   $('#title').addClass('hidden');
   $('#item').removeClass('hidden');
   $('#back_button').removeClass('hidden');
   pageType = 'post';

   // Use $.when.apply($, objs) to wait for multiple ojects
   var commentRequests = getTopComments(item);
}

function getTopComments(item) {
   var commentids = item.kids;

   $('#comment_field').empty();

   // Return if no comments
   if (!commentids) {
      return;
   }

   requests = commentids.map(function(request) {
      return $.ajax(baseURL + '/item/' + request + '.json');
   });

   $.when.apply($, requests).done(function() {
      var comments = Array.prototype.slice.call(arguments);
      var results = [];

      // When there is only one comment, the second value is a string, not an
      // array.
      if (typeof comments[1] === "string") {
         results = [comments[0]];
      } else {
         results = comments.map(function(comment) {
            return comment[0];
         });
      }

      results.forEach(function(comment) {
         var text = comment.deleted ? '[Deleted]' : comment.text;
         var by = '<strong>' + (comment.deleted ? '[Deleted]' : comment.by) + '</strong>';
         var time = '<span class="time_since">' + getDateSincePost(comment.time) + '</span>';
         var element = '<div class="comment_blurb"><p>' + by + time + '<p>' + text + '</p></div>';
         $('#comment_field').append(element);
      });
   });
}

function backToFrontPage() {
   history.back();
   $('#item').addClass('hidden');
   $('#back_button').addClass('hidden');
   $('#front_page').removeClass('hidden');
   pageType = 'list';
}

/**
 * Display time difference in days, hours, or minutes.
 */
function getDateSincePost(postDate) {
   var timeSince = (Date.now() / 1000) - postDate;
   var days = Math.floor(timeSince / (60 * 60 * 24));

   if (days)
      return days + " days ago";

   var hours = Math.floor(timeSince / (60 * 60));

   if (hours)
      return hours + " hours ago";

   var minutes = Math.floor(timeSince / 60);

   return minutes + " minutes ago";
}

$(window).scroll(function() {
   clearTimeout(scrollThrottle);
   scrollThrottle = setTimeout(function() {
      if (pageType === 'list') {
         if (!busy && $(window).scrollTop() + $(window).height() == $(document).height()) {
            busy = true;
            getMoreItems(itemIds, offset);
         }
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
