import loadCoreBundle from 'api/core-loader';
import startSetup from 'api/setup-steps';
import loadPlugins from 'plugins/plugins';
import { PlayerError, SETUP_ERROR_TIMEOUT, MSG_CANT_LOAD_PLAYER } from 'api/errors';

const SETUP_TIMEOUT_SECONDS = 30;

const Setup = function(_model) {

    let _setupFailureTimeout;

    this.start = function (api) {

        const setup = Promise.all([
            loadCoreBundle(_model),
            loadPlugins(_model, api),
            startSetup(_model, api, [])
        ]);

        const timeout = new Promise((resolve, reject) => {
            _setupFailureTimeout = setTimeout(() => {
                const error = new PlayerError(MSG_CANT_LOAD_PLAYER, SETUP_ERROR_TIMEOUT);
                reject(error);
            }, SETUP_TIMEOUT_SECONDS * 1000);
            const timeoutCancelled = () => {
                clearTimeout(_setupFailureTimeout);
            };
            setup.then(timeoutCancelled).catch(timeoutCancelled);
        });

        return Promise.race([setup, timeout]).then(allPromises => setupResult(allPromises));
    };

    this.destroy = function() {
        clearTimeout(_setupFailureTimeout);
        _model.set('_destroyed', true);
        _model = null;
    };
};

/**
 * @typedef { object } SetupResult
 * @property { object } core
 * @property {Array<PlayerError>} warnings
 */

/**
 *
 * @param {Array<Promise>} allPromises - An array of promise resolutions or rejections
 * @returns {SetupResult} setupResult
 */
export function setupResult(allPromises) {
    if (!allPromises || !allPromises.length) {
        return {
            core: null,
            warnings: []
        };
    }

    const warnings = allPromises
        .reduce((acc, val) => acc.concat(val), []) // Flattens the sub-arrays of allPromises into a single array
        .filter(p => p && p.code);

    return {
        core: allPromises[0],
        warnings
    };
}

export default Setup;
