$(function(){ 

    //dropdown

    $('[data-dropdown]').click(function(){
        $('.dropdown-menu').not($(this).find('.dropdown-menu')).hide();
        $(this).find('.dropdown-menu').toggle();
    })

    $(document).click(function(event) {
        if (!$(event.target).closest('[data-dropdown]').length) {
            $('.dropdown-menu').hide();
        }
    });

    //selct2

    $("select.form-control").select2();
    $("select.dropdown-select").select2({
        dropdownParent: '.dropdown-select-menu'
    });
    

    // datepicker
    
    $('input.date-range').each(function() {
        var allTimeLabel = 'All Time';
        var ranges = {
            'All Time': [moment().subtract(10, 'years'), moment()],
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Tomorrow': [moment().add(1, 'days'), moment().add(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        };

        var isMobile = window.matchMedia("(max-width: 767px)").matches;

        $(this).daterangepicker({
            autoUpdateInput: false,
            ranges: isMobile ? false : ranges,
            locale: {
                cancelLabel: 'Clear'
            },
            startDate: moment(),
            endDate: moment(),
            showDropdowns: true,
            alwaysShowCalendars: true,
            showCustomRangeLabel: false,
            minDate: moment('2020-01-01'),
            maxDate: moment(),
            singleDatePicker: isMobile
        });

        $(this).val('');

        $(this).on('apply.daterangepicker', function(ev, picker) {
            if (picker.chosenLabel === allTimeLabel) {
                $(this).val('').change();
                $(this).attr('data-start', '');
                $(this).attr('data-end', '');
            } else {
                if(isMobile){
                    $(this).val(picker.startDate.format('YYYY-MM-DD')).change();
                }
                else{
                    $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD')).change();
                }
                $(this).attr('data-start', picker.startDate.format('YYYY-MM-DD'));
                $(this).attr('data-end', picker.endDate.format('YYYY-MM-DD'));
                $('#hdnLeadDateStartRange').val(picker.startDate.format('YYYY-MM-DD'));
                $('#hdnLeadDateEndRange').val(picker.endDate.format('YYYY-MM-DD'));
            }
        });

        $(this).on('cancel.daterangepicker', function(ev, picker) {
            $(this).val('').change();
            $(this).attr('data-start', '');
            $(this).attr('data-end', '');
        });
    });

    

    $('input.datepicker-past').each(function() {
        $(this).daterangepicker({
            autoUpdateInput: false,
            locale: {
                cancelLabel: 'Clear'
            },
            showDropdowns: true,
            alwaysShowCalendars: false,
            showCustomRangeLabel: false,
            singleDatePicker: true,
            maxDate: moment(),
            startDate: moment(),
        });

        $(this).on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('YYYY-MM-DD')).change();
        });

        $(this).on('cancel.daterangepicker', function(ev, picker) {
            $(this).val('').change();
        });
    });

    $('input.date').each(function() {
        $(this).daterangepicker({
            autoUpdateInput: true,
            locale: {
                cancelLabel: 'Clear'
            },
            showDropdowns: false,
            alwaysShowCalendars: false,
            showCustomRangeLabel: false,
            singleDatePicker: true,
            autoApply: true,
            minDate: moment(),
            startDate: moment(),
            timePicker: true, // Enable time picker
            timePickerIncrement: 1, // Increment the time by 1 minute
            timePicker24Hour: true, // Use 24-hour format
            format: 'YYYY-MM-DD HH:mm', // Format with both date and time
        });

        $(this).val('');

        $(this).on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('YYYY-MM-DD HH:mm')).change();
        });

        $(this).on('cancel.daterangepicker', function(ev, picker) {
            $(this).val('').change();
        });
    });

    // Table

    
    //

    // Model

    var zIndexCounter = 7;

    $('.close-dialog').click(function() {
        var dialog = $(this).closest('dialog')[0];
        if (dialog) {
            dialog.close();
        }
    }); 

    $('[data-dialog]').click(function() {
        var dialogValue = $(this).data('dialog');
        var dialog = $('dialog[data-model="' + dialogValue + '"]')[0];
    
        if (dialog) {
            zIndexCounter++;
            $(dialog).css('z-index', zIndexCounter);
            dialog.show();
        }
    });

    $('dialog').on('click', function(event) {
        if (event.target === this) {
            if (this.open) {
                this.close();
                zIndexCounter = 7;
                $('dialog').css('z-index', zIndexCounter);
            }
        }
    });

    // 

    $('.tab-nav .nav-li-tb').click(function(){
        $(this).addClass('active').siblings().removeClass('active');
    })

    // 

    $('[data-copy]').click(function(){
        var copyText = $(this).data('copy');
        if (copyText) {
            navigator.clipboard.writeText(copyText).then(function() {
                message('copied!','success');
            }).catch(function(error) {
                console.error('Error copying text to clipboard:', error);
            });
        }
    })

    // 

    $('input[type="file"].form-control').on('change', function () {
        var fileName = $(this).val().replace(/C:\\fakepath\\/i, '');
        if (fileName) {
            $(this).css('--filenameinitial', `"${fileName}"`);
        } else {
            $(this).css('--filenameinitial', 'var(--filename)');
        }
    });

    //

    $('.multi-dropdowm-list .li-multi .kuesgr').click(function(){
        $(this).toggleClass('active');
        $(this).siblings('.oaigyh').stop().slideToggle();
        $(this).parent('.li-multi').siblings().find('.oaigyh').slideUp();
        $(this).parent('.li-multi').siblings().find('.kuesgr').removeClass('active');
    })

    //

    if($(window).width() <=991 ){
        $('.manage-leads-sec').addClass('modelLead');
        $('.modelLead .filter-wrap').append('<button type="button" class="close-modelLead"><i class="iconify" data-icon="ic:round-close"></i></button>')
        $('.modelLead .filter-wrap .colA').append('<div class="col sbmt-btn"><button type="button" class="btn w-100 mdlld-sbmt">Submit</button></div>')
        
        $('.modelLead').after('<button type="button" class="asacxn"><i class="iconify" data-icon="hugeicons:filter"></i></button>')


        $('body').on('click','.close-modelLead,.mdlld-sbmt',function(){
            $('.modelLead').removeClass('is-open');
        });
        $('body').on('click','.asacxn',function(){
            $('.modelLead').addClass('is-open');
        })
    }

    //

    $('.nipmgj .bpwzqs').click(function(){
        $(this).addClass('active').siblings().removeClass('active');
    })

    function positionTooltip($this) {
        var position = $this.data('position');
        var $tooltip = $this.find('[data-tooltip]');
        var offset = $this.offset();
        var height = $this.outerHeight();
        var width = $this.outerWidth();

        if (position === 'right') {
            $tooltip.css({
                top: offset.top + (height / 2),
                left: offset.left + width,
                transform: 'translateY(-50%)',
            });
        } else if (position === 'left') {
            $tooltip.css({
                top: offset.top + (height / 2),
                left: offset.left,
                transform: 'translate(-100%, -50%)',
            });
        } else if (position === 'top') {
            $tooltip.css({
                top: offset.top,
                left: offset.left + (width / 2),
                transform: 'translate(-50%, -100%)',
            });
        } else if (position === 'bottom') {
            $tooltip.css({
                top: offset.top + height,
                left: offset.left + (width / 2),
                transform: 'translateX(-50%)',
            });
        }
    }

    function applyTooltipBehavior() {
        $('[data-position]').each(function() {
            var $this = $(this);
            var $tooltip = $this.find('[data-tooltip]');

            if ($(window).width() <= 767) {
                $this.off('hover');
                $('.aside-col ul li').attr('data-position','bottom');
                $this.on('click', function() {
                    $('[data-tooltip]').not($tooltip).hide();
                    $tooltip.toggle();
                    if ($tooltip.is(':visible')) {
                        positionTooltip($this);
                    }
                });
            } else {
                $this.off('click');
                $this.hover(function() {
                    $tooltip.show();
                    positionTooltip($this);
                }, function() {
                    $tooltip.hide();
                });
            }
        });
    }

    applyTooltipBehavior();

    $('.progress').each(function() {
        const $this = $(this);
        const max = parseInt($this.data('max'), 10);
        const value = parseInt($this.data('value'), 10);
        const widthPercentage = (value / max) * 100;
        $this.css('--progress', `${widthPercentage}%`);
    });

    $('#teamLeadTable2').DataTable({
        searching: false,
        ordering: false,
        info: false,
        paging: false,
        scrollX: true,
    });

    $('.view-attendence-home-table').DataTable({
        searching: false,
        ordering: false,
        info: false,
        paging: false,
        scrollX: true,
    });

    count('.count');

    //

    $('.psvkur').click(function(){
        $('.wfdlsb').addClass('is-open');
    })
    $('.ykpgab').click(function(){
        $('.wfdlsb').removeClass('is-open');
    })
})

function showtab(attr, tab) {
    $(`[data-${attr}]`).not(`[data-${attr}="${tab}"]`).hide();
    $(`[data-${attr}="${tab}"]`).show();
    $('#hdnSubcriptionFro').val(tab);
}

function message(message, type) {
    $('.message-pop').remove();
    var messageDiv = $(`<div class="message-pop ${type}">
                            <p>${message}</p>
                            <button type="button" class="close-btn">
                                <i class="iconify" data-icon="material-symbols-light:close"></i>
                            </button>
                        </div>`);

    $('body').append(messageDiv);
    
    setTimeout(function() {
        messageDiv.remove();
    }, 5000);
    
    messageDiv.find('.close-btn').on('click', function() {
        messageDiv.remove();
    });
}

function count(className) {
    $(className).each(function () {
        var $this = $(this),
            countTo = parseInt($this.attr('data-count'), 10),
            halfCount = Math.floor(countTo / 2),
            initialCount = $this.data('data-count') !== undefined ? $this.data('data-count') : halfCount;

        $this.text(halfCount);

        $this.data('data-count', initialCount);

        $({ countNum: initialCount }).animate({ countNum: countTo }, {
            duration: 1000,
            easing: 'swing',
            step: function () {
                $this.text(Math.floor(this.countNum));
            },
            complete: function () {
                $this.text(this.countNum);
            }
        });
    });
}

function initializeDataTable() {
    if ($(window).width() > 991) {
        $('#teamLeadTable').DataTable({
            fixedColumns: {
                start: 1,
            },
            searching: false,
            ordering: false,
            info: false,
            paging: false,
            scrollX: true,
            scrollY: 300
        });
    } else {
        $('#teamLeadTable').DataTable({
            searching: false,
            ordering: false,
            info: false,
            paging: false,
            scrollX: true,
            scrollY: 300
        });
    }
}

initializeDataTable()

function adjustWhatsAppUrls() {
    var screenWidth = $(window).width();
        
    if (screenWidth > 991) {
        $('a[href^="https://api.whatsapp.com/"]').each(function() {
            var currentHref = $(this).attr('href');
            var newHref = currentHref.replace('https://api.whatsapp.com/', 'https://web.whatsapp.com/');
            $(this).attr('href', newHref);
        });
    }
}
adjustWhatsAppUrls();
$(window).resize(function() {
    adjustWhatsAppUrls();
});