import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsPasswordValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPasswordValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;

          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /[0-9]/.test(value);
          const hasNoSpaces = !/\s/.test(value);
          const hasSpecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);

          return hasUpperCase && hasLowerCase && hasNumber && hasNoSpaces && hasSpecialCharacter;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Password must include uppercase, lowercase, number, special character, and no space';
        },
      },
    });
  };
}
