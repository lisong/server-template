#!/bin/bash

DEPLOY_DIR=/opt/web

SCRIPT_DIR=$(realpath $(dirname "$0"))
SOURCE_CODE_DIR=${SCRIPT_DIR}/..
set -e

echo ${SOURCE_CODE_DIR}
node -v
yarn -v

PM2_APP_NAME=$(grep '"name"' ${SOURCE_CODE_DIR}/package.json | sed -E 's/.*"name": "(.*)".*/\1/')
# # 项目目录
PROJECT_PATH="${DEPLOY_DIR}/${PM2_APP_NAME}"
# # pm2 配置路径
PM2_PATH=${DEPLOY_DIR}'/'${PM2_APP_NAME}'/dist/ecosystem.config.js'

echo 'PM2_APP_NAME:'$PM2_APP_NAME

init() {
  if [[ -d "${SOURCE_CODE_DIR}/dist" ]]; then
    rm -rf ${SOURCE_CODE_DIR}/dist
  fi
  mkdir ${SOURCE_CODE_DIR}/dist
}

npm_package() {
  cd $SOURCE_CODE_DIR
  pwd
  yarn install
  yarn build
  cp .env package.json ecosystem.config.js dist
}

cp_file() {
  if [[ -f $1 ]]; then
    cp -f $1 $2
  fi
  if [[ -d $1 ]]; then
    cp -rf $1 $2
  fi
}

deploy() {
  if [ ! -d "${PROJECT_PATH}" ];then
    mkdir ${PROJECT_PATH}
  fi

  arr=(node_modules dist shell)
  for data in ${arr[@]}; do
    cp_file ${SOURCE_CODE_DIR}/$data ${PROJECT_PATH}
    echo 'cp '${SOURCE_CODE_DIR}/$data' '${PROJECT_PATH}
  done
  rm -rf $SOURCE_CODE_DIR/dist
}

init
npm_package
deploy

echo 'finish.'