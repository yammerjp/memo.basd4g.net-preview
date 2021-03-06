import Head from 'next/head'
import Frame from '../components/frame'
import 'highlight.js/styles/github.css'
import Link from 'next/link'
import { PostType } from '../types/post'
import { getStaticPostBySlug } from '../lib/api'
import Article from '../components/article'
import Ogp from '../components/ogp'

const PrivacyPolicy = ({post}: {post:PostType}) => {
  return (
    <>
    <Head>
        <title>memo.basd4g.net - 常に完成形</title>
        <Ogp
          title='プライバシーポリシー - memo.basd4g.net'
          path="/posts/privacy-policy"
          description={post.description || ''}
          ogImage={post.ogImage || ''}
          ogType="article"
        />
        <link rel="stylesheet" href="/assets/article.css"></link>
    </Head>
    <Frame titleIsH1={false}>
      <Article post={post}/>
      <Link href="/">&lt; Home</Link>
    </Frame>
    </>
    )
}

export default PrivacyPolicy

export async function getStaticProps() {
  const post = await getStaticPostBySlug('privacy-policy', [
    'title',
    'date',
    'slug',
    'content',
    'html',
    'description',
    'ogImage'
  ])
  return {
    props: {
      post,
    }
  }
}