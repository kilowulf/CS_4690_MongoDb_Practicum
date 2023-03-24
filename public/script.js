$(document).ready(function() {
  // Disable Add Log button until logs are displayed
  $("#addLog").prop("disabled", true).addClass("opacity-20");
  $("#logEntry").prop("disabled", true).addClass("opacity-20");

  // styling for ul log entry box and containers
  $("select").addClass("rounded");

  // Make UVU ID visible only after course selection has been made
  $("#uvuId, #uvuIdLbl, #uvuIdDisplay, #addLog, #logEntry, #logLbl").hide();
  $("#course").change(function() {
    if ($(this).val() != "") {
      $("#uvuId").attr(
        "placeholder",
        "Enter a valid UVU ID        eg. 10234567"
      );
      $("#uvuId").show();
      $("#uvuIdLbl").show();
    }
    if ($(this).val() == "") {
      // corrected condition
      $(
        "#uvuId, #uvuIdLbl, #uvuIdDisplay, #addLog, #logEntry, #logLbl, #logs"
      ).hide();
      location.reload();
    }
  });
  // variable to prevent slidetoggle of entry during update
  let updateClicked = false;
  let currentDate = new Date();

  // update log entry function
  function addUpdateButton(log, logItem) {
    currentDate = new Date();
    const currentTime = new Date().getTime();
    const logDateObj = new Date(log.date);
    const timeDiff = currentDate.getTime() - logDateObj.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    if (dayDiff < 1) {
      const updateButton = $(
        '<div><button><ion-icon name="create-outline"></ion-icon></button></div>'
      ).addClass("flex justify-end");
      const cancelButton = $(
        '<button type="button" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-4">Cancel</button>'
      ).addClass("mt-4");

      updateButton.click(event => {
        console.log(log);
        event.preventDefault();
        //updateClicked = true;
        const modal = $('<div class="fixed z-10 inset-0 overflow-y-auto">');
        const modalOverlay = $(
          '<div class="fixed inset-0 transition-opacity">'
        ).addClass("bg-gray-500 opacity-75");
        const modalContent = $(
          '<div class="relative bg-white rounded-lg mx-auto mt-24">'
        ).addClass("p-8");

        const form = $("<form>");
        const formGroup = $('<div class="form-group">');
        const label = $(
          '<label for="updated-text">Enter the updated text:</label>'
        ).addClass("text-gray-700 font-bold");
        const input = $('<textarea id="updated-text" rows="3">').addClass(
          "w-full border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        );
        const submitButton = $(
          '<button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Update</button>'
        ).addClass("mt-4");

        cancelButton.click(() => {
          modal.hide();
        });

        form.submit(event => {
          event.preventDefault();
          // set new input from modal
          const newText = input.val();
          // create formatted date object
          const date = new Date();
          const options = {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
          };
          const formattedDate = date.toLocaleString("en-US", options);

          console.log(log);
          if (newText) {
            axios
              .put(`http://localhost:3000/api/v1/logs/${log.id}`, {
                courseId: log.courseId,
                uvuId: log.uvuId,
                date: formattedDate,
                text: newText,
                id: log.id
              })
              .then(response => {
                console.log(response);
                logItem.find("p").html(newText);
                logItem.find("small").html(formattedDate.replaceAll(",", ""));
              })
              .catch(error => {
                console.log(error);
              });
            modal.hide();
          }
        });

        formGroup.append(label, input);
        form.append(formGroup, submitButton, cancelButton);
        modalContent.append(form);
        modal.append(modalOverlay, modalContent);
        $("body").append(modal);
        modal.show();
      });
      logItem.append(updateButton);
    }
  }

  // Dynamically display data within form>select elements
  currentTime = new Date().getTime();
  axios
    .get("http://localhost:3000/api/v1/courses")
    .then(response => {
      response.data.forEach(course => {
        // Use jQuery to create a new <option> element
        const option = $("<option>");
        // set values and content to the appropriate course attributes
        option.val(course.id);
        option.text(course.display);
        $("#course").append(option);
      });
      $("#course").find("option:first-child").prop("selected", false);
    })
    .catch(error => {
      console.error("Error fetching courses:", error);
    });

  /* UVU Id Validation */
  /* Ensure uvuId input checks input for strings no longer than 8 and returns error codes for violations*/

  $("input").on("input", function(event) {
    // Ensure character length never exceeds 8
    if (event.target.value.length > 8) {
      event.target.value = event.target.value.substring(0, 8);
    }
    // Only allow numbers, no letters or other characters
    if (!/^\d+$/.test(event.target.value)) {
      event.target.value = event.target.value.replace(/[^\d]/g, "");
    }

    // When character length reaches 8 and it's only digits, fire off an AJAX request
    if (event.target.value.length === 8) {
      // capture passed courseId and uvuId
      const courseId = $("#course").val();
      const uvuId = event.target.value;
      currentDate = new Date();

      axios
        .get(
          `
          http://localhost:3000/api/v1/logs/${courseId}/${uvuId}`
        )
        .then(response => {
          if (response.status === 200 || response.status === 304) {
            return response.data;
          } else {
            throw new Error("Invalid UVU ID");
          }
        })
        .then(data => {
          // check if object is empty
          if (Object.keys(data).length === 0) {
            throw new Error("Invalid UVU ID");
            // check if the courseId passed in input matches the courseID in response
            // ensures response data reflects only records where a course log has been made under
            // the appropriate uvuId
          } else if (data.find(obj => obj.courseId === courseId)) {
            // Display results
            console.log(data[0]);
            // Get the log entries container
            const logEntries = $("#logs");
            // Clear the container before appending new entries
            logEntries.empty();
            // Iterate over the log data
            data.forEach(log => {
              // set h3 header
              // Update the innerHTML to show the chosen UVU ID
              $("#uvuIdDisplay").removeClass("d-none");
              $("#uvuIdDisplay").addClass("pt-8 text-xl font-bold");
              $("#uvuIdDisplay").show();
              $("#addLog, #logEntry, #logLbl").show();
              $("#uvuIdDisplay").html(`Student Logs for ${log.uvuId}`);
              // Create a new list item
              const logItem = $(`<li>`);

              // Create the log date element
              const logDate = $(`<div><small>${log.date}</small></div>`);
              $("small").addClass(
                "text-lg font-semibold font-sans border-x-gray-300"
              );

              // Create the log text element
              const logText = $(`<pre><p>${log.text}</p></pre>`);
              // Append the date and text elements to the list item
              logItem.append(logDate);
              logItem.append(logText);

              // call update log function to check for any day old entries that can be edited
              addUpdateButton(log, logItem);
              // Append the list item to the log entries container
              logEntries.append(logItem);
            });

            // add css classes to new elements
            $(".log-entries").addClass(
              "p-2 bg-gray-100 border-2 border-solid block"
            );
            $(".log-entries li").addClass(
              "rounded p-2 bg-gray-100 border-2 border-solid block"
            );
            $("div small").addClass(
              "rounded text-base font-medium font-sans border-x-gray-300"
            );
            $("pre").addClass(
              "rounded font-sans border-solid border-inherit whitespace-pre-wrap"
            );

            // re-activate addLog button & textarea
            $("#addLog").prop("disabled", false).removeClass("opacity-20");
            $("#logEntry").prop("disabled", false).removeClass("opacity-20");
            // display only log dates with on click event to view text entries list-items
            $(".log-entries li").click(function(event) {
              // text is queried from the <pre> -preformatted tag
              $(this).find("pre").slideToggle();
            });
          } else {
            throw new Error(
              `No Course Logs could be found for ${courseId} Course under the uvuid ${uvuId}`
            );
          }
        })
        .catch(error => {
          // Appropriate error handling
          console.log(error);
          // Create a Div to set our warning within
          var errorDiv = $("<div>")
            .addClass(
              "font-bold border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700"
            )
            .text(error.message);
          // Append the error message to the body of the document
          $("body").append(errorDiv);
          // Remove the error message after 5 seconds
          setTimeout(function() {
            errorDiv.remove();
          }, 5000);
        });
    }

    // post
    // construct log entry object
    $("#addLog").click(function() {
      const textareaInput = $("#logEntry").val();
      if (!textareaInput) {
        // Exit the function if textarea is empty
        return;
      }

      // create entry
      const entry = {
        courseId: $("#course").val(),
        uvuId: $("#uvuId").val(),
        date: new Date().toLocaleString(),
        text: textareaInput,
        id: Math.random().toString(36).substring(2, 9)
      };

      // Do something with the input (e.g. send it to a server via Axios)
      // Send the POST request, GEt to repopulate log entry list
      currentDate = new Date();
      axios
        .post("http://localhost:3000/api/v1/logs", entry)
        .then(data => {
          const courseId = $("#course").val();
          const uvuId = event.target.value;
          currentDate = new Date();

          axios
            .get(
              `
          http://localhost:3000/api/v1/logs/${courseId}/${uvuId}`
            )
            .then(response => {
              return response.data;
            })
            .then(data => {
              // Get the log entries container
              const logEntries = $("#logs");
              // Clear the container before appending new entries
              logEntries.empty();
              // Iterate over the log data
              data.forEach(log => {
                // set h3 header
                // Update the innerHTML to show the chosen UVU ID
                $("#uvuIdDisplay").removeClass("d-none");
                $("#uvuIdDisplay").addClass("pt-8 text-xl font-bold");
                $("#uvuIdDisplay").show();
                $("#uvuIdDisplay").html(`Student Logs for ${log.uvuId}`);
                // Create a new list item
                const logItem = $(`<li>`);

                // Create the log date element
                const logDate = $(`<div><small>${log.date}</small></div>`);
                $("small").addClass(
                  "text-lg font-semibold font-sans border-x-gray-300"
                );

                // Create the log text element
                const logText = $(`<pre><p>${log.text}</p></pre>`);

                // Append the date and text elements to the list item
                logItem.append(logDate);
                logItem.append(logText);
                // Add the update button if the log is less than 1 day old

                // call update log function to check for any day old entries that can be edited
                addUpdateButton(log, logItem);
                // Append the list item to the log entries container
                logEntries.append(logItem);
              });

              // add css classes to new elements
              $(".log-entries").addClass(
                "p-2 bg-gray-100 border-2 border-solid block"
              );
              $(".log-entries li").addClass(
                "rounded p-2 bg-gray-100 border-2 border-solid block"
              );
              $("div small").addClass(
                "rounded text-base font-medium font-sans border-x-gray-300"
              );
              $("pre").addClass(
                "rounded font-sans border-solid border-inherit whitespace-pre-wrap"
              );

              // re-activate addLog button
              $("#addLog")
                .prop("disabled", false)
                .removeClass("opacity-20 cursor-not-allowed");
              // display only log dates with on click event to view text entries list-items
              $(".log-entries li").click(function(event) {
                // event.preventDefault();
                if (!updateClicked) {
                  //event.preventDefault();
                  $(this).find("pre").slideToggle();
                }
                updateClicked = false; // reset flag variable
                // text is queried from the <pre> -preformatted tag
              });
            });
        })
        .catch(error => {
          console.log(error);
        });
      event.preventDefault();
      $("#logEntry").val("");
    });
  });
});
