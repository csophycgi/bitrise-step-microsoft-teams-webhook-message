#!/bin/bash
set -ex

THIS_SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

npm install --prefix $THIS_SCRIPT_DIR axios moment-timezone --save --verbose

$THIS_SCRIPT_DIR/step.js "${is_debug_mode}" "${webhook_url}" "${team_id}" "${channel_id}" "${app_avatar_api_token}" "${preset_status}"
