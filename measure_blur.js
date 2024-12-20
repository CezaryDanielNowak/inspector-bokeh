var Filters = require('canvasfilters').Filters;

function detectEdges(imageData) {
    var greyscaled = Filters.luminance(
        imageData.width >= 360
            ? Filters.gaussianBlur(imageData, 5.0)
            : imageData
    );

    var sobelKernel = Filters.getFloat32Array(
        [1, 0, -1,
         2, 0, -2,
         1, 0, -1]
    );
    return Filters.convolve(greyscaled, sobelKernel, true);
}

// Reduce imageData from RGBA to only one channel (Y/luminance after conversion to greyscale)
// since RGB all have the same values and Alpha was ignored.
function reducedPixels(imageData) {
    var i, x, y, row,
        pixels = imageData.data,
        rowLen = imageData.width * 4,
        rows = [];

    for (y = 0; y < pixels.length; y += rowLen) {
        row = new Uint8ClampedArray(imageData.width);
        x = 0;
        for (i = y; i < y + rowLen; i += 4) {
            row[x] = pixels[i];
            x += 1;
        }
        rows.push(row);
    }
    return rows;
}

// pixels = Array of Uint8ClampedArrays (row in original image)
function detectBlur(pixels) {
    var x, y, value, oldValue, edgeStart, edgeWidth, bm, percWidth,
        width = pixels[0].length,
        height = pixels.length,
        numEdges = 0,
        sumEdgeWidths = 0,
        edgeIntensThresh = 20;

    for (y = 0; y < height; y += 1) {
        // Reset edge marker, none found yet
        edgeStart = -1;
        for (x = 0; x < width; x += 1) {
            value = pixels[y][x];
            // Edge is still open
            if (edgeStart >= 0 && x > edgeStart) {
                oldValue = pixels[y][x - 1];
                // Value stopped increasing => edge ended
                if (value < oldValue) {
                    // Only count edges that reach a certain intensity
                    if (oldValue >= edgeIntensThresh) {
                        edgeWidth = x - edgeStart - 1;
                        numEdges += 1;
                        sumEdgeWidths += edgeWidth;
                    }
                    edgeStart = -1; // Reset edge marker
                }
            }
            // Edge starts
            if (value == 0) {
                edgeStart = x;
            }
        }
    }

    if (numEdges === 0) {
        bm = 0;
        percWidth = 0;
    } else {
        bm = sumEdgeWidths / numEdges;
        percWidth = bm / width * 100;
    }

    return {
        width: width,
        height: height,
        num_edges: numEdges,
        avg_edge_width: bm,
        avg_edge_width_perc: percWidth
    };
}

function measureBlur(imageData) {
    return detectBlur(reducedPixels(detectEdges(imageData)));
}

measureBlur.setup = function() {
    throw new Error('[inspector-bokeh error] Setup is availabe only in inspector-bookeh/async!');
};

module.exports = measureBlur;