import { defineField, defineType } from 'sanity'

interface InlineImageValue {
  _type?: string
  asset?: {
    _ref?: string
  }
}

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'The category of the post (e.g. News, Tutorial)',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description: 'A short summary of the post',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        }
      ]
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      validation: (Rule) =>
        Rule.custom((value: InlineImageValue[] | undefined) => {
          if (!Array.isArray(value)) {
            return true
          }

          const invalidImageIndex = value.findIndex(
            (block) => block?._type === 'image' && !block.asset?._ref
          )

          if (invalidImageIndex === -1) {
            return true
          }

          return `Inline image block ${invalidImageIndex + 1} is missing an uploaded asset. Re-add or remove that image before publishing.`
        }),
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          validation: (Rule) =>
            Rule.custom((value: InlineImageValue | undefined) => {
              if (!value || value.asset?._ref) {
                return true
              }

              return 'Inline images need an uploaded asset before this post can be published.'
            }),
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            }
          ]
        }
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      media: 'mainImage',
    },
    prepare(selection) {
      const { title, category, media } = selection
      return { 
        title, 
        subtitle: category ? `Category: ${category}` : '',
        media 
      }
    },
  },
})
