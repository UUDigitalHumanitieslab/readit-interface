import registrationForm from '../global/registration-view';
import confirmRegistrationView from '../global/confirm-registration-view';
import user from '../global/user';
import directionRouter from '../global/direction-router';
import authFsm from '../global/authentication-fsm';
import directionFsm from '../global/direction-fsm';

directionRouter.on('route:register', () => authFsm.handle('register'));
directionRouter.on('route:confirm-registration', (key) => {
    confirmRegistrationView.processKey(key);
    directionFsm.handle('confirm');
});

authFsm.on('enter:registering', () => {
    registrationForm.render().$el.appendTo('body');
});
authFsm.on('exit:registering', () => {
    registrationForm.$el.detach();
});
directionFsm.on('enter:confirming', () => {
    confirmRegistrationView.render().$el.appendTo('#main');
});
directionFsm.on('exit:confirming', () => confirmRegistrationView.$el.detach());

user.on('registration:success', () => registrationForm.success());
user.on('registration:error', (response) => registrationForm.error(response));
user.on('registration:invalid', (errors) => registrationForm.invalid(errors));
user.on('confirm-registration:success', () => {
    confirmRegistrationView.success()
});
user.on('confirm-registration:notfound', () => {
    confirmRegistrationView.notFound()
});
user.on('confirm-registration:error', (response) => {
    confirmRegistrationView.error(response)
});

registrationForm.on('register', details => user.register(details));

confirmRegistrationView.on('confirm', key => user.confirmRegistration(key));
