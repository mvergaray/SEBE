$().ready(function () {
  $('.barcode').each(function (item, el) {
       $(el).barcode($(el).attr('code'), 'code39', {output: 'bmp', showHRI: true});
   });

  $('.qrcode').each(function (item, el) {
    var qrcode = new QRCode(el.id, {
      width: 50,
      height: 50
    });
    qrcode.makeCode(el.getAttribute('code'));
  });

  $('.limitLength').each(function(item, el) {
       var value = $(el).text(),
           addEllipsis = value.length > 200;
       $(el).text(value.substr(0, 200) + (addEllipsis ? '...' : ''));
  });
  $('.limitLength-nic').each(function(item, el) {
       var value = $(el).text(),
           addEllipsis = value.length > 100;
       $(el).text(value.substr(0, 100) + (addEllipsis ? '...' : ''));
  });
  $('.limitLength-dc').each(function(item, el) {
       var value = $(el).text(),
           addEllipsis = value.length > 37;
       $(el).text(value.substr(0, 37) + (addEllipsis ? '...' : ''));
  });
  $('.limitLength-small-dc').each(function(item, el) {
       var value = $(el).text(),
           addEllipsis = value.length > 23;
       $(el).text(value.substr(0, 23) + (addEllipsis ? '...' : ''));
  });
});
