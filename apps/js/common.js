
/**
 * Grid class - Represents a 2D grid of cells with symbols (colors)
 * This is the core data structure used throughout the application
 */
class Grid {
    /**
     * Create a new grid with specified dimensions
     * @param {number} height - Number of rows in the grid
     * @param {number} width - Number of columns in the grid
     * @param {Array} values - Optional 2D array of initial values
     */
    constructor(height, width, values) {
        this.height = height;  // Store the height (number of rows)
        this.width = width;    // Store the width (number of columns)
        this.grid = new Array(height);  // Create a new array for rows
        
        // Initialize each cell in the grid
        for (var i = 0; i < height; i++){
            this.grid[i] = new Array(width);  // Create a new array for each row
            for (var j = 0; j < width; j++){
                // If values are provided, use them; otherwise, use 0 (black)
                if (values != undefined && values[i] != undefined && values[i][j] != undefined){
                    this.grid[i][j] = values[i][j];  // Use provided value
                } else {
                    this.grid[i][j] = 0;  // Default to 0 (black)
                }
            }
        }
    }
}

/**
 * Flood fill algorithm - Changes all connected cells of the same color to a new color
 * Similar to the "paint bucket" tool in image editors
 * 
 * @param {Array} grid - 2D array representing the grid
 * @param {number} i - Row index of starting cell
 * @param {number} j - Column index of starting cell
 * @param {number} symbol - New symbol (color) to fill with
 */
function floodfillFromLocation(grid, i, j, symbol) {
    // Convert string parameters to integers
    i = parseInt(i);
    j = parseInt(j);
    symbol = parseInt(symbol);

    // Get the target symbol (color) from the starting cell
    target = grid[i][j];
    
    // If the target is already the same as the new symbol, do nothing
    if (target == symbol) {
        return;
    }

    /**
     * Recursive function to spread the fill to adjacent cells
     * @param {number} i - Current row index
     * @param {number} j - Current column index
     * @param {number} symbol - New symbol to fill with
     * @param {number} target - Target symbol to replace
     */
    function flow(i, j, symbol, target) {
        // Check if the current cell is within the grid boundaries
        if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
            // Check if the current cell has the target symbol
            if (grid[i][j] == target) {
                grid[i][j] = symbol;  // Change the cell's symbol
                
                // Recursively spread to adjacent cells (up, down, left, right)
                flow(i - 1, j, symbol, target);  // Up
                flow(i + 1, j, symbol, target);  // Down
                flow(i, j - 1, symbol, target);  // Left
                flow(i, j + 1, symbol, target);  // Right
            }
        }
    }
    
    // Start the flood fill from the initial cell
    flow(i, j, symbol, target);
}

/**
 * Parse a size string in the format "heightxwidth" (e.g., "3x3", "5x7")
 * Used for resizing grids based on user input
 * 
 * @param {string} size - Size string in format "heightxwidth"
 * @returns {Array} Array containing [height, width] or undefined if invalid
 */
function parseSizeTuple(size) {
    size = size.split('x');  // Split the string at 'x'
    
    // Check if the format is correct (should have exactly 2 parts)
    if (size.length != 2) {
        alert('Grid size should have the format "3x3", "5x7", etc.');
        return;
    }
    
    // Check if the dimensions are at least 1
    if ((size[0] < 1) || (size[1] < 1)) {
        alert('Grid size should be at least 1. Cannot have a grid with no cells.');
        return;
    }
    
    // Check if the dimensions are at most 30
    if ((size[0] > 30) || (size[1] > 30)) {
        alert('Grid size should be at most 30 per side. Pick a smaller size.');
        return;
    }
    
    return size;  // Return the parsed dimensions
}

/**
 * Convert a 2D array of values to a Grid object
 * Used when loading data from JSON files
 * 
 * @param {Array} values - 2D array of grid values
 * @returns {Grid} New Grid object with the provided values
 */
function convertSerializedGridToGridObject(values) {
    height = values.length;  // Get the number of rows
    width = values[0].length;  // Get the number of columns
    return new Grid(height, width, values)  // Create and return a new Grid
}

/**
 * Resize cells to fit within a container
 * Calculates the optimal cell size based on container dimensions
 * 
 * @param {jQuery} jqGrid - jQuery object representing the grid
 * @param {number} height - Number of rows in the grid
 * @param {number} width - Number of columns in the grid
 * @param {number} containerHeight - Height of the container in pixels
 * @param {number} containerWidth - Width of the container in pixels
 */
function fitCellsToContainer(jqGrid, height, width, containerHeight, containerWidth) {
    // Calculate candidate height based on container height and number of rows
    candidate_height = Math.floor((containerHeight - height) / height);
    
    // Calculate candidate width based on container width and number of columns
    candidate_width = Math.floor((containerWidth - width) / width);
    
    // Use the smaller of the two to maintain square cells
    size = Math.min(candidate_height, candidate_width);
    
    // Ensure the size doesn't exceed the maximum cell size
    size = Math.min(MAX_CELL_SIZE, size);
    
    // Apply the calculated size to all cells in the grid
    jqGrid.find('.cell').css('height', size + 'px');
    jqGrid.find('.cell').css('width', size + 'px');
}

/**
 * Fill a jQuery grid element with data from a Grid object
 * Creates the HTML structure for the grid
 * 
 * @param {jQuery} jqGrid - jQuery object representing the grid container
 * @param {Grid} dataGrid - Grid object containing the data
 */
function fillJqGridWithData(jqGrid, dataGrid) {
    jqGrid.empty();  // Clear the existing content
    
    height = dataGrid.height;  // Get the number of rows
    width = dataGrid.width;    // Get the number of columns
    
    // Create each row and cell
    for (var i = 0; i < height; i++){
        var row = $(document.createElement('div'));  // Create a new row element
        row.addClass('row');  // Add the 'row' class
        
        // Create each cell in the row
        for (var j = 0; j < width; j++){
            var cell = $(document.createElement('div'));  // Create a new cell element
            cell.addClass('cell');  // Add the 'cell' class
            cell.attr('x', i);  // Set the row index as an attribute
            cell.attr('y', j);  // Set the column index as an attribute
            setCellSymbol(cell, dataGrid.grid[i][j]);  // Set the cell's symbol (color)
            row.append(cell);  // Add the cell to the row
        }
        
        jqGrid.append(row);  // Add the row to the grid
    }
}

/**
 * Copy data from a jQuery grid to a Grid object
 * Used when the user makes changes to the visual grid
 * 
 * @param {jQuery} jqGrid - jQuery object representing the grid
 * @param {Grid} dataGrid - Grid object to update with the visual grid's data
 */
function copyJqGridToDataGrid(jqGrid, dataGrid) {
    // Count the number of rows in the jQuery grid
    row_count = jqGrid.find('.row').length
    
    // Check if the row count matches the data grid's height
    if (dataGrid.height != row_count) {
        return  // If not, exit without copying
    }
    
    // Calculate the number of columns by dividing the total cell count by the row count
    col_count = jqGrid.find('.cell').length / row_count
    
    // Check if the column count matches the data grid's width
    if (dataGrid.width != col_count) {
        return  // If not, exit without copying
    }
    
    // Copy data from each cell in the jQuery grid to the data grid
    jqGrid.find('.row').each(function(i, row) {
        $(row).find('.cell').each(function(j, cell) {
            // Get the symbol from the cell's attribute and store it in the data grid
            dataGrid.grid[i][j] = parseInt($(cell).attr('symbol'));
        });
    });
}

/**
 * Set a cell's symbol (color) and update its appearance
 * 
 * @param {jQuery} cell - jQuery object representing the cell
 * @param {number} symbol - Symbol (color) to set (0-9)
 */
function setCellSymbol(cell, symbol) {
    cell.attr('symbol', symbol);  // Set the symbol attribute
    
    // Create a string of all possible symbol classes to remove
    classesToRemove = ''
    for (i = 0; i < 10; i++) {
        classesToRemove += 'symbol_' + i + ' ';
    }
    
    cell.removeClass(classesToRemove);  // Remove all symbol classes
    cell.addClass('symbol_' + symbol);  // Add the new symbol class
    
    // Remove the conditional display of symbol numbers
    cell.text('');
}

/**
 * Display an error message to the user
 * 
 * @param {string} msg - Error message to display
 */
function errorMsg(msg) {
    // Stop any ongoing animations for both error and info displays
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);

    // Hide both displays
    $('#error_display').hide();
    $('#info_display').hide();
    
    // Set the error message
    $('#error_display').html(msg);
    
    // Show the error display
    $('#error_display').show();
    
    // Fade out the error display after 10 seconds
    $('#error_display').fadeOut(10000);
}

/**
 * Display an information message to the user
 * 
 * @param {string} msg - Information message to display
 */
function infoMsg(msg) {
    // Stop any ongoing animations for both error and info displays
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);

    // Hide both displays
    $('#info_display').hide();
    $('#error_display').hide();
    
    // Set the info message
    $('#info_display').html(msg);
    
    // Show the info display
    $('#info_display').show();
    
    // Fade out the info display after 10 seconds
    $('#info_display').fadeOut(10000);
}
