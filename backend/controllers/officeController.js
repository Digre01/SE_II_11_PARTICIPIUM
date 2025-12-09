import {officeRepository} from "../repositories/officeRepository.js";

async function getOffice(id) {
    return await officeRepository.findById(id)
}

const officeController = {
    getOffice
};

export default officeController;