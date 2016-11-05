$.getJSON('/sites', function(data) {

    for (var i = 0; i < data.length; i++){

        var card = $('<div>').addClass('card medium').attr('data-id',data[i]._id);
        var cardContent = $('<div>').addClass('card-content');
        var cardTitle = $('<span>').addClass('card-title');
        var cardTitleLink = $('<a>').attr('href',data[i].link).text(data[i].name);
        var cardTextAdd = $('<p>').addClass('add').text(data[i].add);
        var cardTextPhone = $('<p>').addClass('tel').text(data[i].phone);
        var cardLabel = $('<span>').addClass('badge').text(data[i].loc);

        // ADD LINK TO TITLE
        cardTitle.append(cardTitleLink).append(cardLabel);

        cardContent.append(cardTitle).append(cardTextAdd).append(cardTextPhone);
        card.append(cardContent);

        $('#content').append(card);
    }

    var iconMap = $('<i>').addClass('fa fa-map-marker').attr('aria-hidden','true');
    $('.add').prepend(iconMap);

    var iconPhone = $('<i>').addClass('fa fa-phone').attr('aria-hidden','true');
    $('.tel').prepend(iconPhone);
});



$(document).on('click', '.card', function(){
    $('#notes').empty();
    var thisId = $(this).attr('data-id');

    $.ajax({
        method: "GET",
        url: "/sites/" + thisId,
    })
        .done(function( data ) {
            console.log(data);
            $('#notes').append('<h2>' + data.name + '</h2>');
            $('#notes').append('<input id="titleinput" name="title" >');
            $('#notes').append('<textarea id="bodyinput" name="body"></textarea>');
            $('#notes').append('<button data-id="' + data._id + '" id="savenote">Save Note</button>');

            if(data.note){
                $('#titleinput').val(data.note.title);
                $('#bodyinput').val(data.note.body);
            }
        });
});

$(document).on('click', '#savenote', function(){
    var thisId = $(this).attr('data-id');

    $.ajax({
        method: "POST",
        url: "/sites/" + thisId,
        data: {
            title: $('#titleinput').val(),
            body: $('#bodyinput').val()
        }
    })
        .done(function( data ) {
            console.log(data);
            $('#notes').empty();
        });


    $('#titleinput').val("");
    $('#bodyinput').val("");
});
