this.Utils = new Object();

(async () => {
    const __ga = localStorage.getItem('_ga');
    const __ag = localStorage.getItem('_ag');

    if (__ga !== '__1' && __ga !== '__2') {
        localStorage.setItem('_ga', '__1');
    }

    if (__ag !== '_1' && __ag !== '_2' && __ag !== '_3' && __ag !== '_4') {
        localStorage.setItem('_ag', '_1');
    }

    const _ga = localStorage.getItem('_ga');
    const _ag = localStorage.getItem('_ag');

    if (document.querySelector(`#${_ga}`)) {
        document.querySelector(`#${_ga}`).setAttribute('checked', 'checked');
    }

    if (document.querySelector(`#${_ag}`)) {
        document.querySelector(`#${_ag}`).setAttribute('aria-checked', 'true');
    }

    document.body.setAttribute('aria-selection_ga', _ga);
    document.body.setAttribute('aria-selection_ag', _ag);

    $('#__1').on('change', async (e) => {
        document.querySelector('#__1').disabled = true;
        document.querySelector('#__2').disabled = true;
        document.querySelector('.hbs-ui__body').classList.remove('hbs-ui__body--is-visible');

        setTimeout(() => {
            localStorage.setItem('_ga', '__1');
            document.querySelector(`#${localStorage.getItem('_ga')}`).setAttribute('checked', 'checked');
            document.body.setAttribute('aria-selection_ga', localStorage.getItem('_ga'));
        }, 600);

        setTimeout(() => {
            document.querySelector('.hbs-ui__body').classList.add('hbs-ui__body--is-visible');
            document.querySelector('#__1').disabled = false;
            document.querySelector('#__2').disabled = false;
        }, 2000);
    });

    $('#__2').on('change', async (e) => {
        document.querySelector('#__1').disabled = true;
        document.querySelector('#__2').disabled = true;
        document.querySelector('.hbs-ui__body').classList.remove('hbs-ui__body--is-visible');

        setTimeout(() => {
            localStorage.setItem('_ga', '__2');
            document.querySelector(`#${localStorage.getItem('_ga')}`).setAttribute('checked', 'checked');
            document.body.setAttribute('aria-selection_ga', localStorage.getItem('_ga'));
        }, 600);

        setTimeout(() => {
            document.querySelector('.hbs-ui__body').classList.add('hbs-ui__body--is-visible');
            document.querySelector('#__1').disabled = false;
            document.querySelector('#__2').disabled = false;
        }, 2000);
    });
})();

this.Utils.hbs = async () => {
    const hbs = [
        '/dashboard',
        '/activity',
        '/administration',
        '/notifications',
        '/options/account',
        '/options/billing',
        '/options/collaboration',
        '/options/notifications',
        '/options/styles',
        '/options/information',
        '/collaboration/agenda',
        '/collaboration/events',
        '/collaboration/chatrooms',
        '/collaboration/forums',
        '/collaboration/feedback',
        '/legals/frequently-asked-questions',
        '/legals/agreements',
        '/legals/contact-us',
        '/legals/privacy-policy',
        '/legals/terms-and-conditions'
    ];

    const _hbs = [];

    (async () => {
        hbs.forEach(async (__hbs, i) => {
            $.ajax({
                type: 'GET',
                url: `${__hbs}?hbs=true`,
                success: async (hbs) => {
                    _hbs[__hbs] = hbs;
                },
                error: async (err) => {
                    return console.error(err);
                }
            });
        });
    })().then(async () => {
        setTimeout(async () => {
            document.querySelector('.hbs-ui__body').classList.add('hbs-ui__body--is-visible');
        }, 5000);
    });

    this['hbs-ui__selections'] = document.querySelectorAll('.hbs-ui__selections');
    this['hbs-ui__body'] = document.querySelector('.hbs-ui__body');

    this['hbs-ui__selection'] = async (uri) => {
        const selection = uri.replace(/.*\/|\?.*/g, '')
            .replace(/-/g, ' ').split(' ');

        const filters = ['and'];

        selection.forEach(async ($, i, _$) => {
            _$[i] = filters.indexOf($) < 0 ?
                $.charAt(0).toUpperCase() + $.slice(1) : $
        });

        document.querySelector('.hbs-ui__selection').innerHTML = selection.join(' ');
    }

    this['hbs-ui__selections'].forEach(async (selection, i) => {
        if (!selection.hasAttribute('href')) {
            return;
        }

        const uri = window.location.origin + selection.getAttribute('href');
        const dropdown = document.getElementById(window.location.pathname.match(/.*\//g)[0].replace(/\//g, '')) || false;

        if (dropdown) {
            dropdown.classList.add('sidenav__item--expanded');
        }

        if (uri === window.location.href.replace(/#.*/g, '')) {
            this['hbs-ui__selection'](uri);
            selection.setAttribute('aria-current', 'page');
        }

        selection.addEventListener('click', async (e) => {
            e.preventDefault();

            const element = e.currentTarget;

            const uri = window.location.origin + e.currentTarget.getAttribute('href');
            const _uri = e.currentTarget.getAttribute('href');

            $.ajax({
                type: 'GET',
                url: '/ajax?_is=true',
                success: async (_is) => {
                    if (_is.$) {
                        if (!_uri.includes('/legals/')) {
                            return window.location.reload();
                        }
                    }
                },
                error: async (err) => {
                    return console.error(err);
                }
            });

            if (uri === window.location.href.replace(/#.*/g, '') || !element || !this['hbs-ui__body'].classList.contains('hbs-ui__body--is-visible')) {
                return;
            }

            await this['hbs-ui__selection'](uri);
            _hbs[window.location.pathname] = this['hbs-ui__body'].innerHTML;

            document.querySelector('[aria-current=page]').removeAttribute('aria-current');
            element.setAttribute('aria-current', 'page');

            this['hbs-ui__body'].classList.remove('hbs-ui__body--is-visible');

            setTimeout(async () => {
                window.history.replaceState(uri, uri, uri);

                const hbs = _hbs[_uri];

                if (!hbs) {
                    setTimeout(async () => {
                        this['hbs-ui__body'].classList.add('hbs-ui__body--is-visible');
                    }, 5000);

                    return;
                }

                this['hbs-ui__body'].innerHTML = hbs;

                this['~js.js'] = document.querySelector('#js');
                this['~hbs-ui__scripts'] = document.querySelectorAll('.hbs-ui__scripts');

                this['js.js'] = document.createElement('script');

                this['js.js'].src = this['~js.js'].src;
                this['js.js'].id = this['~js.js'].id;

                this['~js.js'].remove();

                setTimeout(async () => {
                    document.querySelector('body').appendChild(this['js.js']);
                }, 1000);

                this['~hbs-ui__scripts'].forEach(async (script, i) => {
                    this['hbs-ui__scripts'] = document.createElement('script');

                    this['hbs-ui__scripts'].setAttribute('class', '~hbs-ui__script');
                    this['hbs-ui__scripts'].innerHTML += script.innerHTML;

                    script.remove();

                    document.querySelector('body').appendChild(this['hbs-ui__scripts']);
                });

                setTimeout(async () => {
                    this['hbs-ui__body'].classList.add('hbs-ui__body--is-visible');
                }, 5000);
            }, 200);
        });
    });
}

this.Utils.hbs();