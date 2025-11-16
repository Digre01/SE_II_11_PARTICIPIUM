import {userOfficeRepository} from "../repositories/userOfficeRepository.js";

async function getUserOfficeByUserId(userId) {
    return await userOfficeRepository.getUserOfficeByUserId(userId);
}

const userOfficeController = {
    getUserOfficeByUserId,
};

export default userOfficeController;