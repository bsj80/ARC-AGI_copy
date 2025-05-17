
// This file contains the main functionality for the ARC testing interface

// Global variables to store the current state of the application
// These variables are accessible throughout the application

// Grid objects for the current input and output
var CURRENT_INPUT_GRID = new Grid(3, 3);  // The current test input grid (3x3 by default)
var CURRENT_OUTPUT_GRID = new Grid(3, 3);  // The user's solution grid (3x3 by default)
var TEST_PAIRS = new Array();  // Array to store all test pairs for the current task
var CURRENT_TEST_PAIR_INDEX = 0;  // Index of the current test pair being displayed
var COPY_PASTE_DATA = new Array();  // Temporary storage for copy-paste operations

// Constants for grid display
var EDITION_GRID_HEIGHT = 500;  // Height of the editable grid in pixels
var EDITION_GRID_WIDTH = 500;   // Width of the editable grid in pixels
var MAX_CELL_SIZE = 100;        // Maximum size of a cell in pixels


// Function to reset the current task state
// Called when loading a new task
function resetTask() {
    // Reset all global variables to their default values
    CURRENT_INPUT_GRID = new Grid(3, 3);
    TEST_PAIRS = new Array();
    CURRENT_TEST_PAIR_INDEX = 0;
    $('#task_preview').html('');  // Clear the task preview area
    resetOutputGrid();  // Reset the output grid
}

// Function to refresh the visual grid with data from the data grid
// jqGrid: jQuery object representing the grid in the DOM
// dataGrid: Grid object containing the data to display
function refreshEditionGrid(jqGrid, dataGrid) {
    fillJqGridWithData(jqGrid, dataGrid);  // Fill the visual grid with data
    setUpEditionGridListeners(jqGrid);     // Set up event listeners for the grid
    fitCellsToContainer(jqGrid, dataGrid.height, dataGrid.width, EDITION_GRID_HEIGHT, EDITION_GRID_HEIGHT);  // Resize cells to fit container
    initializeSelectable();  // Initialize the selectable functionality
}

// Function to copy data from the visual grid to the data grid
// Called when the user makes changes to the visual grid
function syncFromEditionGridToDataGrid() {
    copyJqGridToDataGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
}

// Function to copy data from the data grid to the visual grid
// Called when the data grid is updated programmatically
function syncFromDataGridToEditionGrid() {
    refreshEditionGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
}

// Function to get the currently selected symbol (color)
// Returns the symbol attribute of the selected symbol preview
function getSelectedSymbol() {
    selected = $('#symbol_picker .selected-symbol-preview')[0];
    return $(selected).attr('symbol');
}

// Function to set up event listeners for the edition grid
// These listeners handle cell clicks for editing and floodfill
function setUpEditionGridListeners(jqGrid) {
    jqGrid.find('.cell').click(function(event) {
        cell = $(event.target);  // The clicked cell
        symbol = getSelectedSymbol();  // The currently selected symbol

        // Get the current tool mode (edit, floodfill, or select)
        mode = $('input[name=tool_switching]:checked').val();
        if (mode == 'floodfill') {
            // If floodfill mode: fill all connected cells with the same color
            syncFromEditionGridToDataGrid();  // Update data grid first
            grid = CURRENT_OUTPUT_GRID.grid;
            floodfillFromLocation(grid, cell.attr('x'), cell.attr('y'), symbol);  // Apply floodfill algorithm
            syncFromDataGridToEditionGrid();  // Update visual grid with new data
        }
        else if (mode == 'edit') {
            // If edit mode: fill just the clicked cell
            setCellSymbol(cell, symbol);
        }
    });
}

// Function to resize the output grid based on user input
// Gets dimensions from the output_grid_size input field
function resizeOutputGrid() {
    size = $('#output_grid_size').val();  // Get size from input field (e.g., "3x3")
    size = parseSizeTuple(size);  // Parse the size string into [height, width]
    height = size[0];
    width = size[1];

    // Update the output grid with the new dimensions
    jqGrid = $('#output_grid .edition_grid');
    syncFromEditionGridToDataGrid();  // Save current data
    dataGrid = JSON.parse(JSON.stringify(CURRENT_OUTPUT_GRID.grid));  // Deep copy of current grid data
    CURRENT_OUTPUT_GRID = new Grid(height, width, dataGrid);  // Create new grid with new dimensions
    refreshEditionGrid(jqGrid, CURRENT_OUTPUT_GRID);  // Refresh the visual grid
}

// Function to reset the output grid to a 3x3 empty grid
function resetOutputGrid() {
    syncFromEditionGridToDataGrid();  // Save current data
    CURRENT_OUTPUT_GRID = new Grid(3, 3);  // Create new empty 3x3 grid
    syncFromDataGridToEditionGrid();  // Update visual grid
    resizeOutputGrid();  // Apply any size adjustments
}

// Function to copy the input grid to the output grid
function copyFromInput() {
    syncFromEditionGridToDataGrid();  // Save current data
    // Create a new grid object based on the current input grid
    CURRENT_OUTPUT_GRID = convertSerializedGridToGridObject(CURRENT_INPUT_GRID.grid);
    syncFromDataGridToEditionGrid();  // Update visual grid
    // Update the size display to match the input grid dimensions
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}

// Function to fill the pair preview area with input/output examples
// pairId: Index of the pair to display
// inputGrid: Grid object for the input
// outputGrid: Grid object for the output
function fillPairPreview(pairId, inputGrid, outputGrid) {
    var pairSlot = $('#pair_preview_' + pairId);
    if (!pairSlot.length) {
        // Create HTML for pair with a structured layout
        pairSlot = $('<div id="pair_preview_' + pairId + '" class="pair_preview" index="' + pairId + '"></div>');
        
        // Create container divs for input and output sides
        var inputContainer = $('<div class="input_container"></div>');
        var outputContainer = $('<div class="output_container"></div>');
        
        // Create and append labels
        var inputLabel = $('<div class="input_label">Ex. ' + (pairId + 1) + ' Input</div>');
        var outputLabel = $('<div class="output_label">Ex. ' + (pairId + 1) + ' Output</div>');
        
        // Create grid containers
        var inputGridDiv = $('<div class="input_preview"></div>');
        var outputGridDiv = $('<div class="output_preview"></div>');
        
        // Build the structure
        inputLabel.appendTo(inputContainer);
        inputGridDiv.appendTo(inputContainer);
        outputLabel.appendTo(outputContainer);
        outputGridDiv.appendTo(outputContainer);
        
        inputContainer.appendTo(pairSlot);
        outputContainer.appendTo(pairSlot);
        
        pairSlot.appendTo('#task_preview');
    }
    
    // Get references to the grid containers
    var jqInputGrid = pairSlot.find('.input_preview');
    var jqOutputGrid = pairSlot.find('.output_preview');
    
    // Clear existing content
    jqInputGrid.empty();
    jqOutputGrid.empty();
    
    // Fill the grids with data and adjust cell sizes to fit containers
    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 200, 200);
    fillJqGridWithData(jqOutputGrid, outputGrid);
    fitCellsToContainer(jqOutputGrid, outputGrid.height, outputGrid.width, 200, 200);
    
    // Add visible borders to help identify the grids
    jqInputGrid.css('border', '1px solid #444');
    jqOutputGrid.css('border', '1px solid #444');
}

// Function to load a task from JSON data
// train: Array of training examples (input/output pairs)
// test: Array of test examples (input/output pairs)
function loadJSONTask(train, test) {
    resetTask();  // Reset the current task state
    $('#modal_bg').hide();  // Hide the modal background
    $('#error_display').hide();  // Hide any error messages
    $('#info_display').hide();  // Hide any info messages

    // Process all training examples
    for (var i = 0; i < train.length; i++) {
        pair = train[i];
        values = pair['input'];
        input_grid = convertSerializedGridToGridObject(values)  // Convert input data to Grid object
        values = pair['output'];
        output_grid = convertSerializedGridToGridObject(values)  // Convert output data to Grid object
        fillPairPreview(i, input_grid, output_grid);  // Display the example pair
    }
    
    // Store all test examples
    for (var i=0; i < test.length; i++) {
        pair = test[i];
        TEST_PAIRS.push(pair);
    }
    
    // Load the first test input
    values = TEST_PAIRS[0]['input'];
    CURRENT_INPUT_GRID = convertSerializedGridToGridObject(values)
    fillTestInput(CURRENT_INPUT_GRID);  // Display the test input
    CURRENT_TEST_PAIR_INDEX = 0;
    
    // Update the test input counter display
    $('#current_test_input_id_display').html('1');
    $('#total_test_input_count_display').html(test.length);
}

// Function to display the task name in the UI
// task_name: Name of the task
// task_index: Index of the task in the list (optional)
// number_of_tasks: Total number of tasks (optional)
function display_task_name(task_name, task_index, number_of_tasks) {
    big_space = '&nbsp;'.repeat(4);  // Create a large space for formatting
    document.getElementById('task_name').innerHTML = (
        'Task name:' + big_space + task_name + big_space + (
            task_index===null ? '' :
            ( String(task_index) + ' out of ' + String(number_of_tasks) )
        )
    );
}

// Function to load a task from a file
// e: Event object from the file input change event
function loadTaskFromFile(e) {
    var file = e.target.files[0];  // Get the selected file
    if (!file) {
        errorMsg('No file selected');  // Show error if no file selected
        return;
    }
    
    var reader = new FileReader();  // Create a file reader
    reader.onload = function(e) {
        var contents = e.target.result;  // Get the file contents

        try {
            contents = JSON.parse(contents);  // Parse the JSON data
            train = contents['train'];  // Get training examples
            test = contents['test'];    // Get test examples
        } catch (e) {
            errorMsg('Bad file format');  // Show error if parsing fails
            return;
        }
        loadJSONTask(train, test);  // Load the task

        $('#load_task_file_input')[0].value = "";  // Clear the file input
        display_task_name(file.name, null, null);  // Display the task name
    };
    reader.readAsText(file);  // Read the file as text
}

// Function to load a random task from the ARC GitHub repository
function randomTask() {
    var subset = "training";  // Use the training subset
    // Fetch the list of tasks from GitHub
    $.getJSON("https://api.github.com/repos/fchollet/ARC/contents/data/" + subset, function(tasks) {
        var task_index = Math.floor(Math.random() * tasks.length)  // Pick a random task
        var task = tasks[task_index];
        // Fetch the task data
        $.getJSON(task["download_url"], function(json) {
            try {
                train = json['train'];  // Get training examples
                test = json['test'];    // Get test examples
            } catch (e) {
                errorMsg('Bad file format');  // Show error if parsing fails
                return;
            }
            loadJSONTask(train, test);  // Load the task
            infoMsg("Loaded task training/" + task["name"]);  // Show info message
            display_task_name(task['name'], task_index, tasks.length);  // Display the task name
        })
        .error(function(){
          errorMsg('Error loading task');  // Show error if loading fails
        });
    })
    .error(function(){
      errorMsg('Error loading task list');  // Show error if fetching task list fails
    });
}

// Function to move to the next test input
function nextTestInput() {
    if (TEST_PAIRS.length <= CURRENT_TEST_PAIR_INDEX + 1) {
        errorMsg('No next test input. Pick another file?')  // Show error if no more test inputs
        return
    }
    CURRENT_TEST_PAIR_INDEX += 1;  // Increment the test pair index
    values = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['input'];  // Get the next test input
    CURRENT_INPUT_GRID = convertSerializedGridToGridObject(values)  // Convert to Grid object
    fillTestInput(CURRENT_INPUT_GRID);  // Display the test input
    // Update the test input counter display
    $('#current_test_input_id_display').html(CURRENT_TEST_PAIR_INDEX + 1);
    $('#total_test_input_count_display').html(test.length);
}

// Function to submit the current solution for validation
function submitSolution() {
    syncFromEditionGridToDataGrid();  // Save current data
    reference_output = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output'];  // Get the expected output
    submitted_output = CURRENT_OUTPUT_GRID.grid;  // Get the user's output
    
    // Check if the dimensions match
    if (reference_output.length != submitted_output.length) {
        errorMsg('Wrong solution.');
        return
    }
    
    // Check if all cells match
    for (var i = 0; i < reference_output.length; i++){
        ref_row = reference_output[i];
        for (var j = 0; j < ref_row.length; j++){
            if (ref_row[j] != submitted_output[i][j]) {
                errorMsg('Wrong solution.');
                return
            }
        }
    }
    
    infoMsg('Correct solution!');  // Show success message if solution is correct
}

// Function to fill the test input area with a grid
// inputGrid: Grid object to display
function fillTestInput(inputGrid) {
    jqInputGrid = $('#evaluation_input');  // Get the input grid container
    fillJqGridWithData(jqInputGrid, inputGrid);  // Fill with data
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 400, 400);  // Resize cells to fit container
}

// Function to copy the current input grid to the output grid
// Similar to copyFromInput but with a different name
function copyToOutput() {
    syncFromEditionGridToDataGrid();  // Save current data
    CURRENT_OUTPUT_GRID = convertSerializedGridToGridObject(CURRENT_INPUT_GRID.grid);  // Copy input to output
    syncFromDataGridToEditionGrid();  // Update visual grid
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);  // Update size display
}

// Function to initialize the selectable functionality
// This allows selecting multiple cells at once
function initializeSelectable() {
    try {
        $('.selectable_grid').selectable('destroy');  // Destroy existing selectable
    }
    catch (e) {
        // Ignore errors if selectable doesn't exist
    }
    
    toolMode = $('input[name=tool_switching]:checked').val();  // Get current tool mode
    if (toolMode == 'select') {
        infoMsg('Select some cells and click on a color to fill in, or press C to copy');  // Show help message
        $('.selectable_grid').selectable(
            {
                autoRefresh: false,
                filter: '> .row > .cell',  // Only select cells
                start: function(event, ui) {
                    // Clear existing selections when starting a new selection
                    $('.ui-selected').each(function(i, e) {
                        $(e).removeClass('ui-selected');
                    });
                }
            }
        );
    }
}

// When the document is ready, set up event handlers
$(document).ready(function () {
    // Set up click handler for symbol picker
    $('#symbol_picker').find('.symbol_preview').click(function(event) {
        symbol_preview = $(event.target);
        // Remove selected class from all symbols
        $('#symbol_picker').find('.symbol_preview').each(function(i, preview) {
            $(preview).removeClass('selected-symbol-preview');
        })
        // Add selected class to clicked symbol
        symbol_preview.addClass('selected-symbol-preview');

        // If in select mode, apply the selected symbol to all selected cells
        toolMode = $('input[name=tool_switching]:checked').val();
        if (toolMode == 'select') {
            $('.edition_grid').find('.ui-selected').each(function(i, cell) {
                symbol = getSelectedSymbol();
                setCellSymbol($(cell), symbol);
            });
        }
    });

    // Set up edition grid listeners for all grids
    $('.edition_grid').each(function(i, jqGrid) {
        setUpEditionGridListeners($(jqGrid));
    });

    // Set up file load handlers
    $('.load_task').on('change', function(event) {
        loadTaskFromFile(event);
    });

    // Clear file input value when clicked
    $('.load_task').on('click', function(event) {
      event.target.value = "";
    });

    // Handle tool switching
    $('input[type=radio][name=tool_switching]').change(function() {
        initializeSelectable();  // Reinitialize selectable when tool changes
    });
    
    // Handle grid resizing when Enter is pressed in the size field
    $('input[type=text][name=size]').on('keydown', function(event) {
        if (event.keyCode == 13) {  // Enter key
            resizeOutputGrid();
        }
    });

    // Handle keyboard shortcuts
    $('body').keydown(function(event) {
        // Copy functionality (C key)
        if (event.which == 67) {
            // Press C
            selected = $('.ui-selected');
            if (selected.length == 0) {
                return;  // Do nothing if no cells selected
            }

            // Store data for all selected cells
            COPY_PASTE_DATA = [];
            for (var i = 0; i < selected.length; i ++) {
                x = parseInt($(selected[i]).attr('x'));
                y = parseInt($(selected[i]).attr('y'));
                symbol = parseInt($(selected[i]).attr('symbol'));
                COPY_PASTE_DATA.push([x, y, symbol]);
            }
            infoMsg('Cells copied! Select a target cell and press V to paste at location.');

        }
        if (event.which == 86) {
            // Press P
            if (COPY_PASTE_DATA.length == 0) {
                errorMsg('No data to paste.');
                return;
            }
            selected = $('.edition_grid').find('.ui-selected');
            if (selected.length == 0) {
                errorMsg('Select a target cell on the output grid.');
                return;
            }

            jqGrid = $(selected.parent().parent()[0]);

            if (selected.length == 1) {
                targetx = parseInt(selected.attr('x'));
                targety = parseInt(selected.attr('y'));

                xs = new Array();
                ys = new Array();
                symbols = new Array();

                for (var i = 0; i < COPY_PASTE_DATA.length; i ++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);
                for (var i = 0; i < xs.length; i ++) {
                    x = xs[i];
                    y = ys[i];
                    symbol = symbols[i];
                    newx = x - minx + targetx;
                    newy = y - miny + targety;
                    res = jqGrid.find('[x="' + newx + '"][y="' + newy + '"] ');
                    if (res.length == 1) {
                        cell = $(res[0]);
                        setCellSymbol(cell, symbol);
                    }
                }
            } else {
                errorMsg('Can only paste at a specific location; only select *one* cell as paste destination.');
            }
        }
    });
});
