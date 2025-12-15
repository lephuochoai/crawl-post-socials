import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

const errorTypeMap = new Map<string, string>();

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;

          const contextKey = `${args.object.constructor.name}.${args.property}`;

          if (!/^\+?[0-9]+$/.test(value)) {
            errorTypeMap.set(contextKey, 'INVALID_CHARACTERS');
            return false;
          }

          if (value.charAt(0) === '+') {
            if (value.length <= 9 || value.length > 16) {
              errorTypeMap.set(contextKey, 'INVALID_LENGTH_WITH_COUNTRY_CODE');
              return false;
            }
          } else {
            if (value.length < 5 || value.length > 14) {
              errorTypeMap.set(contextKey, 'INVALID_LENGTH_WITHOUT_COUNTRY_CODE');
              return false;
            }
          }

          errorTypeMap.delete(contextKey);
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const contextKey = `${args.object.constructor.name}.${args.property}`;
          const errorType = errorTypeMap.get(contextKey);

          switch (errorType) {
            case 'INVALID_CHARACTERS':
              return 'Phone must only have numbers and "+" for country code, no spaces';
            case 'INVALID_LENGTH_WITH_COUNTRY_CODE':
              return 'Phone number having country code must be 9-15 digits';
            case 'INVALID_LENGTH_WITHOUT_COUNTRY_CODE':
              return 'Phone numbers without country code must be 5-14 digits';
            default:
              return 'Invalid phone number format';
          }
        },
      },
    });
  };
}
