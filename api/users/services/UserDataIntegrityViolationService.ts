import {DataIntegrityCheckType} from "../../audit/enums/DataIntegrityEnums";
import {IDataIntegrityViolation} from "../../audit/interfaces/IDataIntegrityViolation";
import {IDataIntegrityViolationSet} from "../../audit/interfaces/IDataIntegrityViolationSet";
import {IUserBase} from "../../services/services/users/contracts/IUser";

export class UserDataIntegrityViolationService {
    public getChanged(newUser: IUserBase, oldUser: IUserBase, isUndo: boolean): IDataIntegrityViolationSet {
        if (isUndo) {
            return null;
        }

        const newUsername: string = (newUser.first + " " + newUser.last).toLowerCase();
        const oldUsername: string = (oldUser.first + " " + oldUser.last).toLowerCase();

        if (newUsername === oldUsername) {
            return null;
        }

        const violationSet: IDataIntegrityViolationSet = {
            violations: [],
        };

        const v: IDataIntegrityViolation = {
            checkType: null,
            description: `New Name: ${newUser.first + " " + newUser.last}<br>Old Name: ${oldUser.first + " " + oldUser.last}<br>`,
        };

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
