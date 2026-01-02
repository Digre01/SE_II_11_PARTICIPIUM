import {officeRepository} from "../repositories/officeRepository.js";
import {categoryRepository} from "../repositories/categoryRepository.mjs";

async function getOffice(id) {
    return await officeRepository.findById(id)
}

async function getOfficeCategories(officeId, isExternal) {
    return await categoryRepository.findCategoriesByOfficeId(officeId, isExternal);
}

const officeController = {
    getOffice,
    getOfficeCategories
};

export default officeController;