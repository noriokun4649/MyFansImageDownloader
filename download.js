//MIT License
//Copyright (c) 2022 noriokun4649

const mycookie = document.cookie.split('; ').map(item => {
    const detas = item.split('=');
    return { key: detas[0], value: detas[1] }
}).find(item => item.key === '_mfans_token').value;

const getRequest = async function (url) {
    const fet = await fetch(url,
        {
            headers: {
                'authorization': 'Token token=' + mycookie,
                'google-ga-data': 'event328',
                'user-agent': 'MyFansImageDownloader(ChromeExtension)/1.0.0'
            }
        });
    return fet.json();
};

const getUserID = async function (username) {
    const json = await getRequest('https://api.myfans.jp/api/v2/users/show_by_username?username=' + username);
    return json.id;
}
const getUserPosts = async function (username) {
    const json = await getRequest('https://api.myfans.jp/api/v2/users/show_by_username?username=' + username);
    return json.posts_count;
}

const getPostsImages = async function (username) {
    if (username === '') {
        throw 'このページでのダウンロードは非対応です'
    }
    const id = await getUserID(username);
    const limit = await getUserPosts(username);
    if (id == null || limit == undefined){
        throw 'ユーザーが見つかりません';
    }
    const json = await getRequest('https://api.myfans.jp/api/v1/users/' + id + '/posts?page=1&sort_key=publish_start_at&limit=' + limit)
    if (json.length <= 0) {
        throw '投稿が見つかりません！';
    } else if (json.error) {
        throw '内部エラー：' + json.error;
    }
    return json.map(item => item.post_images.map(images => images.file_url)).reduce((acc, elem) => acc.concat(elem))
};

const download = function (username) {
    alert('画像の一括ダウンロードを開始しました\n投稿数の多いアカウントの場合時間がかかります\nダウンロードが完了するまで開いたままにしてください')
    getPostsImages(username)
        .then(urls => urls.map(url => fetch(url)))
        .then(ite => Promise.all(ite)
            .then(items => items.map(item => item.blob()))
            .then(images => {
                const zip = new JSZip()
                for (let i = 0; i < images.length; i++) {
                    zip.file(username + i + '.jpg', images[i])
                }
                zip.generateAsync({ type: 'blob' })
                    .then(blob => saveAs(blob, username + '.zip'))
            })
        ).catch(e => alert(e + '\n\nダウンロードを中止します'))
}

const addDownloadButton = () => {
    const myButtonId = 'image-download-9898';
    const button = document.createElement('button');
    button.id = myButtonId;
    button.innerText = '画像一括ダウンロード';
    button.onclick = () => {
        const uname = window.location.toString().split('/').pop();
        download(uname);
    }
    const titleElem = document.getElementsByTagName('div')[3];
    const buttonElem = document.getElementById(myButtonId);
    if ((titleElem != null || titleElem != undefined ) && buttonElem == undefined) {
        titleElem.appendChild(button)
    }
}

new MutationObserver(() => {
    addDownloadButton()
}).observe(
    document.head,
    { subtree: true, characterData: true, childList: true }
);

addDownloadButton()