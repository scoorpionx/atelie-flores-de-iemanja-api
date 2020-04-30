'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Image = use('App/Models/Image')
const { manage_single_upload, manage_multiples_upload } = use('App/Helpers')
const fs = use('fs')
const Transformer = use('App/Transformers/Admin/ImageTransformer')

/**
 * Resourceful controller for interacting with images
 */
class ImageController {
  /**
   * Show a list of all images.
   * GET images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ req, res, pagination, transform }) {
    var images = await Image.query()
      .orderBy('id')
      .paginate(pagination.page, pagination.limit)

    image = await transform.paginate(images, Transformer)
    return res.send(images)
  }

  /**
   * Create/save a new image.
   * POST images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ req, res, transform }) {
    try {
      const fileJar = req.file('images', {
        types: ['images'],
        size: '5mb'
      })

      let images = []

      if(!fileJar.files) {
        const file = await manage_single_upload(fileJar)
        if(file.moved()) {
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype
          })

          const transformedImage = await transform.item(image, Transformer)
          images.push(transformedImage)

          return res.status(201).send({ successes: images, errors: {} })
        }
        return res.status(400).send({
          message: 'Não foi possível processar esta imagem no momento!'
        })
      }

      let files = await manage_multiples_upload(fileJar)

      await Promise.all(
        files.successes.map(async file => {
          
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype
          })

          const transformedImage = await transform.item(image, Transformer)
          images.push(transformedImage)
        })
      )
      
      return res.status(201).send({
        successes: images,
        errors: files.errors
      })
    } catch (err) {
      return res.status(400).send({
        message: 'Não possível processar a sua solicitação!'
      })
    }
  }

  /**
   * Display a single image.
   * GET images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params: { id }, req, res, transform }) {
    const image = await Image.findOrFail(id)
    const transformedImage = await transform.item(image, Transformer)

    return res.send(transformedImage)
  }

  /**
   * Update image details.
   * PUT or PATCH images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: { id }, req, res }) {
    const image = await Image.findOrFail(id)
    try {
      image.merge(request.only(['original_name']))
      await image.save()
      
      const transformedImage = await transform.item(image, Transformer)
      return res.status(200).send(transformedImage)
    } catch (err) {
      return res.status(400).send({
        message: 'Não foi possível atualizar esta imagem no momento!'
      })
    }
  }

  /**
   * Delete a image with id.
   * DELETE images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: { id }, req, res }) {
    const image = await Image.findOrFail(id)
    try {
      let filepath = Helpers.publicPath(`uploads/${image.path}`)

      await fs.unlinkSync(filepath)
      await image.delete()

      return res.status(204).send()
    } catch (err) {
      return res.status(400).send({
        message: 'Não foi possível deletar a imagem no momento!'
      })
    }
  }
}

module.exports = ImageController
