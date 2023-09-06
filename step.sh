#!/bin/bash
set -ex

THIS_SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node -v
npm init -force
npm install --prefix $THIS_SCRIPT_DIR axios moment-timezone --save
ls -la $THIS_SCRIPT_DIR/node_modules

$THIS_SCRIPT_DIR/step.js "${is_debug_mode}" "${webhook_url}" "${team_id}" "${channel_id}" "${app_avatar_api_token}" "${preset_status}"
