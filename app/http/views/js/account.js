 requirejs.config({
    baseUrl: "/js",
    paths: {
      "jquery": "../bower/jquery/jquery.min",
      "persona-sso": "{{ audience }}/sso/include",
      "text": "../bower/text/text"
    },
    shim: {
      "persona-sso": [],
      "sso-ux": [ "jquery", "persona-sso" ]
    }
  });
  require([ "jquery", "/bower/webmaker-ui/ui.js", "persona-sso", "sso-ux" ], function ($, UI) {
    var personaEmail,
      langSelector = document.querySelector('#lang-picker');

    // CRSF Protection
    var csrf_token = $( "meta[name='csrf-token']" ).attr( "content" );
    $.ajaxSetup({
      beforeSend: function( request ) {
       request.setRequestHeader( "X-CSRF-Token", csrf_token ); // express.js uses a non-standard name for csrf-token
      }
    });

    navigator.idSSO.app.onlogin = function( email, username, data ) {
      personaEmail = email;
      $( "#logout-message" ).hide();
      $( ".wm-user-panel" ).fadeIn();
      $( ".wm-email" ).text( email );
      $( ".wm-username" ).text( username );
      $( "#user-avatar" ).css( "background-image", "url(https://secure.gravatar.com/avatar/" + data.emailHash + "?s=200&d=https%3A%2F%2Fstuff.webmaker.org%2Favatars%2Fwebmaker-avatar-200x200.png)" );

      $( "#sendEventCreationEmailsCheckbox" ).prop( "checked", data.sendEventCreationEmails );
    };

    navigator.idSSO.app.onlogout = function() {
      $( ".wm-user-panel" ).hide();
      $( "#confirm-delete" ).hide();
    };
    $( "#delete-account" ).click(function( e ){
      e.preventDefault();
      $( "#confirm-delete" ).fadeIn();
    });
    $( "#delete-me" ).click(function( e ){
      if ( $( "#email-check" ).val() === personaEmail ) {
        $.post( "/account/delete", function( data ) {
          if ( !data.error ) {
            $( ".wm-user-panel" ).fadeOut();
            $( "#logout-message" ).fadeIn();
            navigator.idSSO.logout();
            setTimeout(function() {
              window.location.href = "{{ audience }}";
            }, 2000);
          }
        });
      } else {
        $( "#wrong-email" ).fadeIn();
        setTimeout(function() {
          $( "#wrong-email" ).fadeOut();
        }, 3000);
      }
    });

    // The button to close the confirm-delete box
    $( "#boxclose" ).click(function() {
      $( "#confirm-delete" ).fadeOut();
    });

    // URL redirector for language picker
    UI.langPicker(langSelector);

    $( "#sendEventCreationEmailsCheckbox" ).change(function(e) {
      var checked = $( this ).prop( "checked" ) ? 1 : 0;

      $.ajax({
        type: "PUT",
        url: "/account/update",
        data: {
          sendEventCreationEmails: checked
        },
        success: function( data, textStatus ) {
          console.log( data, textStatus );
          $( ".email-prefs.prefs-saved" ).fadeIn().delay( 1000 ).fadeOut();
        },
        error: function( jqXHR, textStatus, errorThrown ) {
          console.log( textStatus, errorThrown );
          $( ".email-prefs.prefs-error" ).fadeIn().delay( 1000 ).fadeOut();
        }
      });
    });
  });
