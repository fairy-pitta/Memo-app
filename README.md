# Memo-app
 
# 初めに

REST Frameworkを使ったAPIの操作の勉強がてら、バックエンドでDjango、フロントエンドにReactを使ったメモアプリを作成しました。DjangoとReactの基礎知識はある前提で、使用したコード・コマンドを全て記録に残したものがこちらの記事になります。

メモアプリはこんな感じ↓

![Screenshot 2024-06-22 at 4.39.13 PM.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/2611731/bfff85ed-f9e2-19c6-66d9-e05f9e909719.png)


### 使用するツールとライブラリのバージョン
MacBook Pro M2 

Python: 3.12.1
Django: 5.0.1
Django REST framework: 3.15.1
Node.js: 20.11.0
npm: 10.2.4
React: 18.3.1
Typescript: 4.9.5

### 最終的なディレクトリ構成

```
Memo-app
├── README.md
├── backend
│   ├── db.sqlite3
│   ├── manage.py
│   ├── memo
│   ├── memo_project
│   └── venv
└── frontend
    ├── README.md
    ├── node_modules
    ├── package-lock.json
    ├── package.json
    ├── public
    ├── src
    └── tsconfig.json
```

### 使用したコード

https://github.com/fairy-pitta/Memo-app


## Djangoプロジェクトのセットアップ

まずはディレクトリを作成し、移動してバックエンドのフォルダを作ります。

```console
mkdir Memo-app
cd Memo-app

mkdir backend
cd backend
```

仮想環境を作成し、有効化します。

```console
python -m venv venv
source venv/bin/activate
!-- windowsの場合、venv\Scripts\activate --
```
DjangoとREST Frameworkをインストールします。

```console
pip install django djangorestframework
```

Djangoのプロジェクトとアプリを作成し、アプリを`INSTALLED_APP`に追加します。

```memo_project/settings.py
INSTALLED_APPS = [
    ...,
    'rest_framework',
    'memo',
]
```

これで基本的なDjangoプロジェクトのセットアップは完了しました。

## モデルの定義

### モデルの作成

メモモデルを定義します。タイトルと本文があれば十分でしょう。記事のidは明示的に書かなければ自動で生成されるので今回は書きません。

```memo/models.py
from django.db import models

from django.db import models

class Memo(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()

    def __str__(self):
        return self.title
```

### モデルの反映

コンソールにて以下のコマンドを実行し、データベースにモデルを反映させます。

```
python manage.py makemigrations
python manage.py migrate
```
### 管理者サイトに登録

モデルを管理者サイトから見られるようにします。

```memo/admin.py

from django.contrib import admin
from .models import Memo

admin.site.register(Memo)

```

### 管理者サイトの確認

管理者サイトを確認します。まずはコンソールで管理者アカウントを作成します。

```console
python manage.py createsuperuser
```
名前、メールアドレス、パスワードを聞かれますが、今回はテストなので適当につけます。
パスワードは表示されませんがちゃんと入力されているので大丈夫です。

```
Username: test
Email address: test@example.com
Password: 
Password (again): 
```

こんな感じで逐次入力していきます。

作成が終わったら、サーバーを動かしてみます。

```console
python manage.py runserver
```

下記のようなメッセージが出てくれば成功です。

```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
June 22, 2024 - 04:26:31
Django version 5.0.6, using settings 'memo_project.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

まずはhttp://127.0.0.1:8000/ にアクセスしてみます。

![Screenshot 2024-06-22 at 12.29.03 PM.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/2611731/639fc770-5943-53c5-ba42-a558815c7daa.png)

こんな画面が出てくれば成功です。

続いて管理者画面（http://127.0.0.1:8000/admin/） にアクセスしてみます。

ログイン画面が出てくるので、先ほど設定したユーザー名とパスワードでログインします。
すると次のような画面が出てきます。

![Screenshot 2024-06-22 at 12.32.51 PM.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/2611731/827630ff-c6d7-d73a-76d2-b07e2de97cf2.png)

Memosがしっかりモデルとして追加されているのがわかります。Memosをクリックし、`+Add`をクリックして試しにいくつかデータを追加していきます。

![Screenshot 2024-06-22 at 12.33.12 PM.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/2611731/4583c605-806a-9042-9ecd-7f6c4a09d830.png)


![Screenshot 2024-06-22 at 12.34.18 PM.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/2611731/04f6aa7f-f823-a4bd-174e-27d81e9dd0f2.png)

これで3つほどデータを試しに作成しました。このデータをAPIをつかって操作していきます。

いったん`Ctrl+C`でサーバーを止めておきましょう。

## Django REST Frameworkの設定

### シリアライザーの作成

Djangoにおけるシリアライザーとは、DjangoのモデルをJSONなどの適切なデータ形式に変換します。

https://qiita.com/kachuno9/items/c72f91203dba9356c605

`memo`に新しく`serializers.py`を作成し、シリアライザーを記述します。

```memo/serializers.py
from rest_framework import serializers
from .models import Memo

class MemoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Memo
        fields = '__all__'
```

`fields`で指定したカラムを表示できるようになっています。

`fields = ('title', 'content', 'id')`

としても良いですが、全部なので`__all__`で済ませます。

### ビューの追加

ビューでは、`ModelViewSet`を用いることでモデルへのCRUD操作(Create, Read, Update, Delete)をまとめて定義することができます。`queryset`でモデルのどのデータを取得するのかを指定し、`serializer_class`で使用するシリアライザーを指定します。

```memo/views.py
from rest_framework import viewsets
from .models import Memo
from .serializers import MemoSerializer

class MemoViewSet(viewsets.ModelViewSet):
    queryset = Memo.objects.all()
    serializer_class = MemoSerializer
```

### プロジェクトにルートを追加

実際にサイトにアクセスしたとき、`api`というパスで`memo`アプリに移動できるように設定を行います。

```memo_project/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('memo.urls')),
]

```

### ルーティングの設定

ルーティングは、HTTPリクエストを適切なビューに案内します。`memo`に`urls.py`を作成し、`api/memos/`にアクセスするとAPIにアクセスできるように設定をします。

```memo/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemoViewSet

router = DefaultRouter()
router.register(r'memos', MemoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```



### APIの動作確認

ではもう一度、サーバーを動かしてみます。

```console
python manage.py runserver
```

今設定した http://127.0.0.1:8000/api/memos/ にアクセスします。

![Screenshot 2024-06-22 at 1.04.50 PM.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/2611731/f06a82c2-dddf-88c8-dfdc-5011c2dc664d.png)

これで先ほど入力したデータが見えるようになっており、さらに下の欄からデータを追加することもできるようになっています。


ここまでできたら一旦Django側の準備は完了です。次からReact側の準備をしていきます。一旦サーバーを`Ctrl+C`で停止し、元々の`Memo-app`ディレクトリに戻っておきます。

```console
cd ../
```




## Reactフロントエンドのセットアップ

### 基本セットアップ
TypescriptのReactaプロジェクトを設定します。Node.jsとnpmは事前にインストールしておく必要があります。

https://kinsta.com/jp/blog/how-to-install-node-js/


```console
npx create-react-app frontend --template typescript
```

少し時間がかかりますが、待ちます。下記のようなディレクトリ構成になっているはずです。

```
Memo
 |
 |--backend
 |--frontend

 ```

 確認できたら作成したディレクトリに移動しておきましょう。

 ```
 cd frontend
 ```

 コンソールで以下のコマンドを実行すると、reactの画面に遷移することができます。(http://localhost:3000/)

 ```console
 npm start
 ```

 

#### CORS設定
DjangoがReactからのAPIリクエストを受け付けるように、ReactサーバーのポートをDjangoのホワイトリストに追加します。CORS設定に不備があると意図していないサイトからのAPIリクエストに答えてデータを渡してしまうことがあるので、設定には注意が必要です。

参考↓

https://www.securify.jp/blog/cross-origin-resource-sharing/


まずは`corsheaders`パッケージをインストールします。

```console
pip install django-cors-headers
```

`backend/memo_project/settings.py`に以下の内容を追加します。

```memo_project/settings.py
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    ...
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]

```


#### サーバーを同時に動かす

現時点では、Djangoの開発サーバーとReactの開発サーバーは別々で動かしていました。ReactでDjangoのAPIからデータを持ってくるにはどちらのサーバーも同時に動かす必要があるので、`concurrently`パッケージを用いて一つのコマンドで両方のサーバーを起動できるようにします。二つのサーバーを同時に動かすには他にも方法がありますが、今回は簡単のためこちらを使用します。

まずは`frontend`ディレクトリで`concurrently`をインストールします。

```console
npm install concurrently --save-dev
```

続いて、package.jsonに以下の内容を追記します。

```package.json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    // 依存関係のリスト
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "server": "cd ../frontend && source venv/bin/activate && python manage.py runserver",  // Windowsなら `venv\\Scripts\\activate`
    "dev": "concurrently \"npm start\" \"npm run server\""
  }
}
```


これでDjangoの開発サーバーとReactの開発サーバーを同時に動かす準備ができました。

```console
npm dev run
```

上記のコマンドを実行し、http://localhost:3000/ と http://localhost:8000/api/memos/ にアクセスしてどちらも実行されていることを確認しましょう。

 ### APIクライアントの設定

 `src/api.ts`を作成し、Djangoからデータを持ってくるクライアントを設定します。

 今回はCRUD操作を確認したいので、それぞれに対応するクライアントを定義します。

 ```src/api.ts

const API_BASE_URL = 'http://localhost:8000/api/memos/';

export const createMemo = async (title: string, content: string) => {
    const response = await fetch(`${API_BASE_URL}`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({title, content})
    });

    if (!response.ok){
        throw new Error("failed to create memo")
    }

    return await response.json()
};

export const fetchMemos = async () => {
    const response = await fetch(`${API_BASE_URL}`);

    if (!response.ok){
        throw new Error('failed to fetch the data');
    }

    return await response.json();
};

export const updateMemo = async (id: number, title: string, content: string) => {
    const response = await fetch(`${API_BASE_URL}${id}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
    });
    if (!response.ok) {
        throw new Error('Failed to update memo');
    }
    return await response.json();
};

export const deleteMemo = async (id : number) => {
    const response = await fetch(`${API_BASE_URL}${id}`, {
        method: 'DELETE',
    });

    if (!response.ok){
        throw new Error("failed to delete memo")
    }

};
 ```

 ### 実際の画面作成

 続いて、実際にメモを書く画面を作っていきます。

 まずは`App.tsx`でざっくりとしたjsxを書きます。

 ```src/App.tsx
import React from 'react';
import './App.css';

function App() {
  return (
    <div className='container'>
        <h1>Memo App</h1>
        <div className='InputArea'>
            <input
                type="text"
                placeholder="Title"
            />
            <textarea
                placeholder="Content"
            />
            <button>Update Memo</button>
            <button>Add Memo</button>
            <button>Refresh Memos</button>
        </div>

    <ul>
      {/* ここに作成したメモが入る */}
    </ul>
  </div>
  );
}

export default App;
```
そして、ざっくりCSSを当てます。

```src/App.css

/* App.css */

body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    max-width: 800px;
    border-radius: 16px;
}

h1 {
    text-align: center;
    color: #333;
}

input, textarea {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.InputArea {
    margin: 20px;
    align-items: center;
}

button {
    display: inline-block;
    padding: 10px 20px;
    margin: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #218838;
}
```

![Screenshot 2024-06-22 at 1.33.45 PM.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/2611731/9e56143c-3b00-d3f0-5b24-50dacc2a772a.png)

こんな感じになります。

 では、実際にボタンを押した時の操作を実装していきます。

 ### 必要な関数の定義

 まずは先ほど作ったAPIクライアントを`App.tsx`にインポートしておきます。

 ```src/App.tsx
import React from 'react';
import { fetchMemos, createMemo, deleteMemo, updateMemo } from './api';
import './App.css';

//残りのコード
 ```

#### インターフェースを定義

メモオブジェクトが持つべきプロパティやその型を指定します。

```src/App.tsx

function App() {

  interface Memo {
    id: number;
    title: string;
    content: string; 
  };

  return (
  // 残りのコードが入る
  );
}

export default App;
```

参考↓

https://qiita.com/nogson/items/86b47ee6947f505f6a7b

#### React.FCの使用

constでの型定義でコンポーネントを定義する型を使用します。React.FCを使用すると、関数コンポーネントの型を明確に指定できるので型安全性が向上します。

https://qiita.com/kim_t0814/items/50d46b5f560831005ebc

現在の`App.tsx`

```src/App.tsx

import React from 'react';
import { fetchMemos, createMemo, deleteMemo, updateMemo } from './api';
import './App.css';


const App: React.FC = () => {

  interface Memo {
    id: number;
    title: string;
    content: string; 
  };

  return (
  // 残りのコード
  );
}

export default App;
```

#### 状態管理の変数を定義

`useState`フックを利用し、各変数の状態を初期化します。

```src/App.tsx

const App: React.FC = () => {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');

    interface Memo {
        id: number;
        title: string;
        content: string; 
      };
      
    return (
    // 残りのコード
  );
};

export default App;
```

### メモをGETする

さて、APIからデータを持ってくる関数を書きます。非同期関数として定義します。Refreshボタンを押した時に`memo`を更新してタイトルと本文を`map`関数で表示するようにしてみます。

参考↓

https://qiita.com/akifumii/items/f65023dba4dc3ad75bce

```src/App.tsx
import React, {useState, useEffect} from 'react';
import { fetchMemos, createMemo, deleteMemo, updateMemo } from './api';
import './App.css';

const App: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  interface Memo {
    id: number;
    title: string;
    content: string; 
  };

  const fetchInitialMemos = async () => {
    try {
        const initialMemos = await fetchMemos();
        setMemos(initialMemos);
    } catch (error) {
        console.error('Failed to fetch memos', error);
    }
  };

  useEffect(() => {
    fetchInitialMemos();
}, []);

  return (
    <div className='container'>
    <h1>Memo App</h1>
    <div className='InputArea'>
        <input
            type="text"
            placeholder="Title"
        />
        <textarea
            placeholder="Content"
        />
        <button>Update Memo</button>
        <button>Add Memo</button>
        <button onClick={fetchInitialMemos}>Refresh Memos</button>
    </div>

    <ul>
    {memos.map((memo) => (
                    <li key={memo.id}>
                        <h2>{memo.title}</h2>
                        <p>{memo.content}</p>
                    </li>
                ))}
    </ul>
  </div>
  );
}

export default App;
```

コンポーネントがマウントされるたびにリフレッシュしてメモを取得して欲しいので、`userEffect`フックを用いて関数を実行もしています。

ここまでで一回Reactの開発サーバーを動かして様子を見てみましょう。

```console
npm run dev
```


これで先ほどテストとして入力したテストデータが取得され表示されていたらGET完了です。

![Screenshot 2024-06-22 at 4.39.13 PM.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/2611731/c120b77a-4404-2e39-31fe-bdb13f791c60.png)


### メモをPOSTする

続いてPOST、つまり新規メモを作成する関数を書いていきます。やりたいことは、inputで受け取ったタイトルと本文をデータベースに追加し、そのあとでタイトルと本文を初期化するという一連の動作です。

先ほどAPIクライアントで作成した`createMemo`関数は`title`と`content`を引数としてとり、新しいメモを作成します。作成後は、`memos`にそれを追加します。

    処理後の初期化まで含めると、以上の動作はこのように書けます。

```typescript
try {
  const newMemo = await createMemo(title, content);
  setMemos([...memos, newMemo]);
  setTitle('');
  setContent('');
} catch (error) {
  console.error("failed to create memo", error);
}
```

あとは、メモ作成時のバリデーションをしましょう。titleとcontentが空文字でないことを確認するif文を関数に追記しておきます。

inputとボタンを適切にアップデートすると、下記のようになります。

```App.tsx
import React, {useState, useEffect} from 'react';
import { fetchMemos, createMemo, deleteMemo, updateMemo } from './api';
import './App.css';

const App: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  interface Memo {
    id: number;
    title: string;
    content: string; 
  };

  const fetchInitialMemos = async () => {
    try {
        const initialMemos = await fetchMemos();
        setMemos(initialMemos);
    } catch (error) {
        console.error('Failed to fetch memos', error);
    }
  };

  useEffect(() => {
    fetchInitialMemos();
}, []);

const handleCreateMemo = async () => {

  if (title.trim() === '' || content.trim() === ''){
    alert("Title and Content are required");
    return;
  }

  try {
    const newMemo = await createMemo(title, content);
    setMemos([...memos, newMemo]);
    setTitle('');
    setContent('');
  } catch (error) {
    console.error("failed to create memo", error);
  }
};


  return (
    <div className='container'>
    <h1>Memo App</h1>
    <div className='InputArea'>
        <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
        />
        <button>Update Memo</button>
        <button onClick={handleCreateMemo}>Add Memo</button>
        <button onClick={fetchInitialMemos}>Refresh Memos</button>
    </div>

    <ul>
    {memos.map((memo) => (
                    <li key={memo.id}>
                        <h2>{memo.title}</h2>
                        <p>{memo.content}</p>
                    </li>
                ))}
    </ul>
  </div>
  );
}

export default App;
```

この状態で画面に戻り、メモを画面から追加できることを確認しておきましょう。


### メモをDELETEする

続いて、メモを削除するための関数`handleDeleteMemo`を定義していきます。それぞれのメモにはIDがあるので、IDを指定してそのメモを削除し、メモのリストを更新します。

以下の関数を`App.tsx`に追記します。

```App.tsx
const handleDeleteMemo = async (id: number) => {
  try {
    await deleteMemo(id);
    setMemos(memos.filter((memo) => memo.id !== id));
  } catch (error) {
    console.error("failed to delete memo", error);
  }
};
```

Deleteボタンをまだ実装していなかったので、リストに追加しておきます。

```jsx
<ul>
    {memos.map((memo) => (
        <li key={memo.id}>
            <h2>{memo.title}</h2>
            <p>{memo.content}</p>
            <button onClick={() =>handleDeleteMemo(memo.id)}>Delete</button>
        </li>
    ))}
</ul>
```

これで削除機能は完了です。

### メモをPUTする

メモを編集(Update)する関数`handleEditMemo`を書いていきます。イメージとしては、
① 既存のメモの欄にEditボタンを追加
② ボタンを押した際、タイトルと本文が入力欄に入力されて中身を編集できるようにする
③ 編集完了後、Updateボタンを押すと編集が反映される
という流れです。


① Editボタン追加

```jsx
{memos.map((memo) => (
  <li key={memo.id}>
      <h2>{memo.title}</h2>
      <p>{memo.content}</p>
      <button onClick={() => handleEditMemo(memo)}>Edit</button>
      <button onClick={() => handleDeleteMemo(memo.id)}>Delete</button>
  </li>
))}
```

② ボタンを押した時の関数

これが設定されているかを状態として使いたいので、userStateフックを用いて新たなconstを定義します。

```typescript
const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
```

```typescript
const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo);
    setTitle(memo.title);
    setContent(memo.content);
};
```

これで、Editボタンを押すとそのメモの内容が入力欄に移動するようにできました。

③ Updateボタンで編集を反映する

a. まずは`editingMemo`の状態を確認します。これが`null`でなければ、編集対象のメモが設定されています。
b. 編集対象のメモをIDで同定し、更新します。
c. メモリストを更新します。
d. 色々リセットします。

```typescript
  const handleUpdateMemo = async () => {
      if (editingMemo) {
          try {
              const updatedMemo = await updateMemo(editingMemo.id, title, content);
              setMemos(memos.map((memo) => (memo.id === updatedMemo.id ? updatedMemo : memo)));
              setEditingMemo(null);
              setTitle('');
              setContent('');
          } catch (error) {
              console.error("Failed to update memo", error);
          }
      }
  };
```

`handleUpdate`関数はUpdateボタンに設定しておきます。





以上で、欲しかった機能を全て実装し終えました。下に完成した`App.tsx`を示します。

```Api.tsx
import React, {useState, useEffect} from 'react';
import { fetchMemos, createMemo, deleteMemo, updateMemo } from './api';
import './App.css';

const App: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);

  interface Memo {
    id: number;
    title: string;
    content: string; 
  };

  const fetchInitialMemos = async () => {
    try {
        const initialMemos = await fetchMemos();
        setMemos(initialMemos);
    } catch (error) {
        console.error('Failed to fetch memos', error);
    }
  };

  useEffect(() => {
    fetchInitialMemos();
}, []);

const handleCreateMemo = async () => {

  if (title.trim() === '' || content.trim() === ''){
    alert("Title and Content are required");
    return;
  }

  try {
    const newMemo = await createMemo(title, content);
    setMemos([...memos, newMemo]);
    setTitle('');
    setContent('');
  } catch (error) {
    console.error("failed to create memo", error);
  }
};

const handleDeleteMemo = async (id: number) => {
  try {
    await deleteMemo(id);
    setMemos(memos.filter((memo) => memo.id !== id));
  } catch (error) {
    console.error("failed to delete memo", error);
  }
};

const handleEditMemo = (memo: Memo) => {
  setEditingMemo(memo);
  setTitle(memo.title);
  setContent(memo.content);
};

const handleUpdateMemo = async () => {
  if (editingMemo) {
      try {
          const updatedMemo = await updateMemo(editingMemo.id, title, content);
          setMemos(memos.map((memo) => (memo.id === updatedMemo.id ? updatedMemo : memo)));
          setEditingMemo(null);
          setTitle('');
          setContent('');
      } catch (error) {
          console.error("Failed to update memo", error);
      }
  }
};


  return (
    <div className="container">
      <h1>Memo App</h1>
      <div className="InputArea">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleUpdateMemo}>Update Memo</button>
        <button onClick={handleCreateMemo}>Add Memo</button>
        <button onClick={fetchInitialMemos}>Refresh Memos</button>
      </div>

      <ul>
        {memos.map((memo) => (
          <li key={memo.id}>
            <h2>{memo.title}</h2>
            <p>{memo.content}</p>
            <button onClick={() => handleEditMemo(memo)}>Edit</button>
            <button onClick={() => handleDeleteMemo(memo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

## Aftermath 

### GitHubにあげる時の注意点

Djangoの`setttings.py`に記載されている`SECTRET_KEY`と`DEBUG`は環境変数に移動させておきます。

#### python-dotenvのインストール

.envファイルから環境変数を読み込むためのパッケージです。

```console
pip install python-dotenv
```

#### .envファイルの作成

ルートディレクトリに.envファイルを作成し、`settings.py`内部の`SECTRET_KEY`と`DEBUG`を移動させます。

```backend/.env
# .env
SECRET_KEY=your_secret_key_here
DEBUG=True
```

#### setting.pyの修正

settings.pyからpython-dotenvを用いて環境変数を読み込みます。

```settings.py
from pathlib import Path
import os
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# 環境変数から読み込む
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
```

あとは`.env`ファイルは`.gitignore`に追加しておきましょう。


## 最後に

お疲れ様でした。少々説明を端折ったところやコードだけ貼って終わりにしたところがあるので、そこは各自で補填してもらえたらと思います。説明やコードなどで間違っているところがあれば教えていただけると幸いです。


