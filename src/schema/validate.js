import schema from './schema.json' with { type: 'json' }
import { validator } from '@exodus/schemasafe'

const validate = validator(schema)

export default validate
