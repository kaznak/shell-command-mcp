#!/bin/bash

export USER=${1}
shift
export HOME=/home/$USER

# WORKDIR の uid と gid を調べる
uid=$(stat -c "%u" $WORKDIR)
gid=$(stat -c "%g" $WORKDIR)

if [ "$uid" -ne 0 ]; then
    if [ "$(id -g $USER)" -ne $gid ]; then
        # ユーザーの gid とカレントディレクトリの gid が異なる場合、
        # ユーザーの gid をカレントディレクトリの gid に変更し、ホームディレクトリの gid も正常化する。
        getent group $gid >/dev/null 2>&1 || groupmod -g $gid $USER
        chgrp -R $gid $HOME
    fi
    if [ "$(id -u $USER)" -ne $uid ]; then
        # ユーザーの uid とカレントディレクトリの uid が異なる場合、
        # ユーザーの uid をカレントディレクトリの uid に変更する。
        # ホームディレクトリは usermod によって正常化される。
        usermod -u $uid $USER
    fi
fi

if [ -z "$(find "$HOME" -mindepth 1 -print -quit)" ]; then
    cp -rp /home/mcp-home-backup/. $HOME
fi

# このスクリプト自体は root で実行されているので、uid/gid 調整済みのユーザーとして指定されたコマンドを実行する。
exec setpriv --reuid=$USER --regid=$USER --init-groups "$@"
