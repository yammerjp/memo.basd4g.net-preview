import fs from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import { exec } from 'child_process'

import markdownToHtml from './markdownToHtml'
import markdownToDescription from './markdownToDescription'
import { OgImageUrlInText } from './cloudinaryOgp'

import { PostHistoryType } from '../types/post'

const postsDirectory = join(process.cwd(), 'content', 'posts')
const staticPostsDirectory = join(process.cwd(), 'content')

export async function getPostSlugs() {
  return await fs.readdir(postsDirectory)
}

export async function getStaticPostBySlug(slug: string, fields: string[] = []) {
  return getPostByDirectoryAndSlug(staticPostsDirectory, slug, fields)
}

export async function getPostBySlug(slug: string, fields: string[] = []) {
  return getPostByDirectoryAndSlug(postsDirectory, slug, fields)
}

async function getPostHistoryByDirectoryAndSlug(dir: string, slug: string): Promise<PostHistoryType> {
  const realSlug = slug.replace(/\.md$/, '')
  const fullPath = join(dir, `${realSlug}.md`)
  return new Promise((resolve, reject) => {
    exec(`git log --format=COMMITIS%cd,%H,%s --date=iso8601-strict ${fullPath}`, (err, stdout, stderr)  => {
      if (err) {
        reject();
      }
      const history = stdout.split('COMMITIS').slice(1).map( line => {
        const [date, hash, message] = line.split(',')
        return { date, message, hash }
      })
      resolve(history)
    })
  })
}

async function getPostByDirectoryAndSlug(dir: string, slug_: string, fields: string[] = []) {
  const realSlug = slug_.replace(/\.md$/, '')
  const fullPath = join(dir, `${realSlug}.md`)
  const fileContents = await fs.readFile(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  type Items = {
    [key: string]: string
  }

  const items: Items = {}
  let slug = '';
  let title = '';
  let date = '';
  let html = '';
  let tags: string[] = [];
  let description = '';
  let history: PostHistoryType = [];
  let ogImage = '';

  // Ensure only the minimal needed data is exposed
  if (fields.includes('slug')) {
    slug = realSlug;
  }
  if (fields.includes('title')) {
    title = data['title']
  }
  if (fields.includes('date')) {
    date = data['date']
  }
  if (fields.includes('html')) {
    html = await markdownToHtml(content || '')
  }
  if (fields.includes('tags')) {
    tags = data['tags'] || []
  }
  if (fields.includes('description')) {
    description = await markdownToDescription(content || '')
  }
  if (fields.includes('history')) {
    history = await getPostHistoryByDirectoryAndSlug(dir, slug_)
  }
  if (fields.includes('ogImage')) {
    ogImage = data['ogImage'] || OgImageUrlInText(data['title'])
   }

  return { slug, title, date, html, tags, description, history, ogImage }
}

export async function getAllPosts(fields: string[] = []) {
  const slugs = await getPostSlugs()
  const posts = await Promise.all(slugs
    .map((slug) => getPostBySlug(slug, fields)))
    // sort posts by date in descending order
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
}

export async function getNeighborPosts(slug: string, fields: string[] = [ 'slug' ]) {
  const allPosts = await getAllPosts(fields);
  const idx = allPosts.findIndex( post => post.slug === slug);
  if (idx === -1) {
    console.error("Need to specify EXISTING slug with calling getNeighborPosts()")
    return { next: null, prev: null}
  }
  return {
    next: (idx-1 >= 0) ? allPosts[idx-1] : null,
    prev: (idx+1 <= allPosts.length-1) ? allPosts[idx+1] : null,
  }
}
