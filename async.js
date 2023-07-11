var workerMessageId = 0; // Number.MIN_SAFE_INTEGER would be better,
                         // but I don't think it will ever reach Number.MAX_SAFE_INTEGER
var workerPromises = {};
var config = {
    workerURL: "measure_blur_worker.js",
    worker: null,
};

function measureBlurAsync(imageData) {
    if (!config.worker) {
        config.worker = new Worker(config.workerURL);
    }

    config.worker.onmessage = function(e) {
        workerPromises[e.data.id](e.data.score);
        delete workerPromises[e.data.id];
    };

    return new Promise(function(resolve) {
        var id = ++workerMessageId;
        config.worker.postMessage({
            id: id,
            imageData: imageData
        });
        workerPromises[id] = resolve;
    });
}

measureBlurAsync.setup = function(configExt) {
    Object.assign(config, configExt);
};

measureBlurAsync.remove = function(configExt) {
    if (config.worker) {
        config.worker.terminate();
        config.worker = null;
        workerPromises = {};
    }
};

module.exports = measureBlurAsync;