import loadCoreBundle from 'api/core-loader';
import startSetup from 'api/setup-steps';
import loadPlugins from 'plugins/plugins';
import { PlayerError, SETUP_ERROR_TIMEOUT, MSG_CANT_LOAD_PLAYER } from 'api/errors';

const SETUP_TIMEOUT_SECONDS = 60;

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

        return Promise.race([setup, timeout]);
    };

    this.destroy = function() {
        clearTimeout(_setupFailureTimeout);
        _model.set('_destroyed', true);
        _model = null;
    };

};

export default Setup;
