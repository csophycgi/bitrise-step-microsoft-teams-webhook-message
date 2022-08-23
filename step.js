#!/usr/bin/env node

const axios = require('axios');
const moment = require('moment-timezone');

const debug = process.argv[2]; // debug yes/no
const webhook_url = process.argv[3]; // webhook_url
const team_id = process.argv[4]; // team_id
const channel_id = process.argv[5]; // channel_id
const app_avatar_api_token = process.argv[6]; // app_avatar_api_token
const preset_status = process.argv[7]; // preset_status

const app_title = process.env.BITRISE_APP_TITLE;
const app_url = process.env.BITRISE_APP_URL;
const app_slug = process.env.BITRISE_APP_SLUG;
const workflow_title = process.env.BITRISE_TRIGGERED_WORKFLOW_TITLE;
const build_number = process.env.BITRISE_BUILD_NUMBER;
const build_url = process.env.BITRISE_BUILD_URL || 'https://bitrise.io';
const build_date = moment.unix(process.env.BITRISE_BUILD_TRIGGER_TIMESTAMP);
const now_date = moment();
const build_duration_minutes = Math.floor(now_date.diff(build_date, 'minutes'));
const build_duration_seconds = Math.floor(now_date.diff(build_date, 'seconds') % 60);
const git_is_pr = process.env.PR;
const git_pr_id = process.env.BITRISE_PULL_REQUEST;
const git_tag = process.env.BITRISE_GIT_TAG;
const git_branch = process.env.BITRISE_GIT_BRANCH;
const git_branch_dest = process.env.BITRISEIO_GIT_BRANCH_DEST;
const git_commit_hash = process.env.BITRISE_GIT_COMMIT;
const git_message = process.env.BITRISE_GIT_MESSAGE;

let app_avatar_url = null;

// testing parameters
if (debug == null || webhook_url == null || team_id == null || channel_id == null || preset_status == null) {
  console.log('ERROR : One or more parameters are invalid');
  return 1;
}

if (debug === 'yes') {
  console.log('******* WEBHOOK MESSAGE - INPUT PARAMETERS *******');
  console.log('Debug: ' + debug);
  console.log('Webhook URL: ' + webhook_url);
  console.log('Team Id: ' + team_id);
  console.log('Channel Id: ' + channel_id);
  console.log('API Token: ' + app_avatar_api_token);
  console.log('Preset Status: ' + preset_status);
  console.log('App Title: ' + app_title);
  console.log('App URL: ' + app_url);
  console.log('App slug: ' + app_slug);
  console.log('Workflow Title: ' + workflow_title);
  console.log('Build Number: ' + build_number);
  console.log('Build URL: ' + build_url);
  console.log('Build date: ' + build_date.toISOString());
  console.log('Build duration (minutes): ' + build_duration_minutes);
  console.log('Build duration (seconds): ' + build_duration_seconds);
  console.log('PR: ' + git_is_pr);
  console.log('PR Id: ' + git_pr_id);
  console.log('Git Tag: ' + git_tag);
  console.log('Git Branch: ' + git_branch);
  console.log('Git Branch Dest: ' + git_branch_dest);
  console.log('Git Commit Hash: ' + git_commit_hash);
  console.log('Git message: ' + git_message);
}

function capitalize(text) {
  return text
    .toLowerCase()
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
}

function getState() {
  if (preset_status !== 'auto') {
    return preset_status;
  }
  if (process.env.BITRISE_BUILD_STATUS === '0') {
    return 'success';
  }
  return 'failed';
}

function getStateTitle() {
  if (preset_status !== 'auto') {
    return capitalize(preset_status);
  }
  if (process.env.BITRISE_BUILD_STATUS === '0') {
    return 'Success';
  }
  return 'Failed';
}

function getStateColor() {
  switch (preset_status) {
    case 'running':
      return '683D87';
    case 'aborted':
      return 'FCC500';
    case 'failed':
      return 'F82159';
    default:
      if (process.env.BITRISE_BUILD_STATUS === '0') {
        return '33C389';
      }
      return 'F82159';
  }
}

function getStateEmoji() {
  switch (preset_status) {
    case 'running':
      return '🛠';
    case 'aborted':
      return '✋';
    case 'failed':
      return '💥';
    default:
      if (process.env.BITRISE_BUILD_STATUS === '0') {
        return '🎉';
      }
      return '💥';
  }
}

async function getAppAvatar() {
  const api_url = `https://api.bitrise.io/v0.1/apps/${app_slug}`;

  try {
    const res = await axios.get(api_url, { headers: { Accept: 'application/json', Authorization: app_avatar_api_token } });
    if (debug == 'yes') {
      console.log('******* APP AVATAR RETRIEVAL - RESPONSE *******');
      console.log('STATUS:', res.status);
      console.log('RESPONSE:', res.data);
      console.log('App avatar icon url:' + res.data.data.avatar_url);
    }
    app_avatar_url = res.data.data.avatar_url;
    return 0;
  } catch (error) {
    console.error(
      'ERROR: Failed to retrieve app avatar url',
      error.message
    );
    return 1;
  }
  

}

async function sendWebhookMessage() {

  //*********************************************
  // Build the title

  let notification_title = `${getStateEmoji()}  ${getStateTitle()} @ ${app_title} • `;
  
  if (git_tag != null) { // Tag
    notification_title += `🏷  ${git_tag}`;
  } else if (git_is_pr == 'true') { // Pull request
    notification_title += `PR#${git_pr_id}: ${git_branch} » ${git_branch_dest}`;
  } else { // Push
    notification_title += `${git_branch}`;
  }
  notification_title += ` → ${workflow_title}`;

  //*********************************************
  // Build the body

  let notification_body = `<hr style='border: 2px solid #${getStateColor()};border-radius: 2px;margin-top: 5px; margin-bottom: 5px;'/>`;

  notification_body += "<p style='font-weight: bold'>";
  if (app_avatar_url != null) {
    notification_body += `<img src='${app_avatar_url}' style='width:20px;height:20px;display:inline;'/>  `;
  }
  notification_body += `<a href='${app_url}'>${app_title}</a></p>`;

  if (git_commit_hash != null) {
    const git_commit_hash_short = git_commit_hash.substring(0, 7);
    notification_body += `<p style='margin-top:5px;'>🔗  ${git_commit_hash_short}`
    if (git_message != null) {
      notification_body += ` 📝  ${git_message}</p>`;
    }
    notification_body+= '</p>';
  }
  
  notification_body += `<p style='margin-top: 5px;color: grey'>Triggered @ ${moment(build_date).tz('Europe/Paris').format('HH:mm')} - ${build_duration_minutes}m ${build_duration_seconds}s - <a href='${build_url}'>#${build_number}</a></p>`;

  const payload = { teamId: team_id, channelId: channel_id, title: notification_title, message: notification_body };

  if (debug == 'yes') {
    console.log('title:', notification_title);
    console.log('body:', notification_body);
  }

  try {
    const res = await axios.post(webhook_url, payload);
    if (debug == 'yes') {
      console.log('******* WEBHOOK MESSAGE - WEBHOOK SUCCESS RESPONSE *******');
      console.log('STATUS:', res.status);
      console.log('RESPONSE:', res.data);
    }
    return 0;
  } catch (error) {
    console.error(
      'ERROR: Failed to send the webhook message',
      error.message
    );
    return 1;
  }
}

async function main() {
  const avatar_res = await getAppAvatar();
  const send_res = await sendWebhookMessage();
  return send_res;
}

return main();
