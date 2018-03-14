import {DataIntegrityCheckType} from "../../audit/enums/DataIntegrityEnums";
import {DataIntegrityViolation} from "../../audit/objects/DataIntegrityViolation";
import {DataIntegrityViolationSet} from "../../audit/objects/DataIntegrityViolationSet";
import {IUser} from "../interfaces/IUser";

export class UserDataIntegrityViolationService {
    public getChanged(newUser: IUser, oldUser: IUser, isUndo: boolean): DataIntegrityViolationSet {
        if (isUndo) {
            return null;
        }

        const newUsername: string = (newUser.first + " " + newUser.last).toLowerCase();
        const oldUsername: string = (oldUser.first + " " + oldUser.last).toLowerCase();

        if (newUsername === oldUsername) {
            return null;
        }

        const violationSet = new DataIntegrityViolationSet();
        const v = new DataIntegrityViolation();

        v.description = `New Name: ${newUser.first + " " + newUser.last}<br>Old Name: ${oldUser.first + " " + oldUser.last}<br>`;

        if (newUser.email.toLowerCase() === oldUser.email.toLowerCase()) {
            v.checkType = DataIntegrityCheckType.USER_NAME_CHANGED;
        } else {
            v.checkType = DataIntegrityCheckType.USER_NAME_EMAIL_CHANGED;
            v.description += `New Email: ${newUser.email}<br>Old Email: ${oldUser.email}<br>`;
        }

        violationSet.violations.push(v);

        return violationSet;
    }
}
