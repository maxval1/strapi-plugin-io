const { isEmpty, merge } = require('lodash/fp');

const geAttributes = (model) => {
	if (model.uid === 'plugin::upload.file') {
		const { related, ...attributes } = model.attributes;
		return attributes;
	}

	return model.attributes;
};

const getFullPopulateObject = (modelUid, maxDepth = 20) => {
	if (maxDepth <= 1) {
		return true;
	}

	if (modelUid === 'admin::user') {
		return undefined;
	}

	const populate = {};
	const model = strapi.getModel(modelUid);

	for (const [key, value] of Object.entries(geAttributes(model))) {
		if (value) {
			switch (value.type) {
				case 'component': {
					populate[key] = getFullPopulateObject(value.component, maxDepth - 1);
					break;
				}
				case 'dynamiczone': {
					const dynamicPopulate = value.components.reduce((prev, cur) => {
						const curPopulate = getFullPopulateObject(cur, maxDepth - 1);
						return curPopulate === true ? prev : merge(prev, curPopulate);
					}, {});
					populate[key] = isEmpty(dynamicPopulate) ? true : dynamicPopulate;
					break;
				}
				case 'relation': {
					const relationPopulate = getFullPopulateObject(
						value.target,
						key === 'localizations' && maxDepth > 2 ? 1 : maxDepth - 1,
					);
					if (relationPopulate) {
						populate[key] = relationPopulate;
					}
					break;
				}
				case 'media': {
					populate[key] = true;
					break;
				}
			}
		}
	}

	return isEmpty(populate) ? true : { populate };
};

module.exports = {
	getFullPopulateObject,
};
