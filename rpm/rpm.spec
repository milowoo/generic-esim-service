#
# COPYRIGHT Ericsson 2016
# All rights reserved
#
# The copyright to the computer program(s) herein is the property of
# Ericsson AB. The programs may be used and/or copied only
# with written permission from Ericsson AB or in accordance with
# with the terms and conditions stipulated in the agreement/contract
# under which the program(s) have been supplied.
#
# This file and all modifications and additions to the pristine
# package are under the same license as the package itself.
#


%define _name      genericesim
%define version    150.3.0102
%define _rpmdir    /var/tmp
%define basedir    /opt/miep
%define moduledir  %{basedir}/lib/node_modules
%define projectdir %(echo $PWD)
%define contentdir %{projectdir}/rpm/content/

Name:          SES%{_name}
Version:       %{version}
Release:       __timestamp__
Vendor:        Ericsson AB
License:       Commercial
Group:         Applications/Administration
Autoreqprov:   no
BuildRoot:     %{_tmppath}/%{name}-%{version}-build
BuildArch:     x86_64
Summary:       SES API Gateway.
Requires:      SESnodesupervisor, nodejs >= 5, consul

%Description
SES API Gateway
Built from commit << __commit__ >>

%prep
rm -rf ${RPM_BUILD_ROOT}


%install
mkdir -p ${RPM_BUILD_ROOT}/var/log/miep
mkdir -p ${RPM_BUILD_ROOT}%{basedir}/tools/%{_name}
mkdir -p ${RPM_BUILD_ROOT}%{basedir}/etc/consulconfig/
mkdir -p ${RPM_BUILD_ROOT}%{basedir}/bin/ns/
mkdir -p ${RPM_BUILD_ROOT}%{moduledir}
mkdir -p ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService
mkdir -p ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy
mkdir -p ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision
mkdir -p ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision/schema
mkdir -p ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision/schema/types


mv -v %{projectdir}/package/ ${RPM_BUILD_ROOT}%{moduledir}/%{_name}
cp -pv %{contentdir}/%{_name}.ns ${RPM_BUILD_ROOT}%{basedir}/bin/ns/
cp -pv %{contentdir}/startstop.sh ${RPM_BUILD_ROOT}%{basedir}/tools/%{_name}/
cp -pv %{contentdir}/consulconfig.json ${RPM_BUILD_ROOT}%{basedir}/etc/consulconfig/%{_name}.json
cp -pv %{contentdir}/smdpServerProfile.json ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService
cp -pv %{contentdir}/cpsServerConf.json ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService
cp -pv %{contentdir}/itSystemServerConf.json ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService
cp -pv %{contentdir}/soapproxy/SyncEsimProvision/ESIMSubscription.wsdl ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision
cp -pv %{contentdir}/soapproxy/SyncEsimProvision/options.json ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision
cp -pv %{contentdir}/soapproxy/SyncEsimProvision/schema/cai3g1.2_provisioning.xsd ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision/schema
cp -pv %{contentdir}/soapproxy/SyncEsimProvision/schema/ESIMSubscription.xsd ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision/schema
cp -pv %{contentdir}/soapproxy/SyncEsimProvision/schema/PGFault.xsd ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision/schema
cp -pv %{contentdir}/soapproxy/SyncEsimProvision/schema/types/dataTypes.xsd ${RPM_BUILD_ROOT}%{basedir}/etc/config/esimService/soapproxy/SyncEsimProvision/schema/types



%clean

%files

%dir %attr(0770,miepadm,miepgrp) %{basedir}/tools/%{_name}
%dir %attr(0770,miepadm,miepgrp) %{moduledir}/%{_name}
%dir %attr(0770,miepadm,miepgrp) /var/log/miep
%dir %attr(0770,miepadm,miepgrp) %{basedir}/etc/config/esimService

%attr(0555,miepadm,miepgrp) %{moduledir}/%{_name}/*
%attr(0555,miepadm,miepgrp) %{basedir}/etc/consulconfig/%{_name}.json
%attr(0555,miepadm,miepgrp) %{basedir}/bin/ns/%{_name}.ns
%attr(0555,miepadm,miepgrp) %{basedir}/tools/%{_name}/*
%attr(0555,miepadm,miepgrp) %{basedir}/etc/config/esimService/*
